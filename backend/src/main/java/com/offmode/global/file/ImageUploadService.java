package com.offmode.global.file;

import com.offmode.global.exception.BusinessException;
import com.offmode.global.status.ErrorStatus;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import javax.imageio.ImageIO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.unit.DataSize;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Service
@RequiredArgsConstructor
public class ImageUploadService {

  private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png");
  private static final Map<String, String> CONTENT_TYPES_BY_EXTENSION =
      Map.of(
          "jpg", "image/jpeg",
          "jpeg", "image/jpeg",
          "png", "image/png");

  private final Optional<S3Client> s3Client;

  @Value("${file.upload-dir:./uploads}")
  private String uploadDir;

  @Value("${r2.bucket:}")
  private String r2Bucket;

  @Value("${r2.public-url:}")
  private String r2PublicUrl;

  @Value("${spring.servlet.multipart.max-file-size:10MB}")
  private DataSize maxImageSize;

  public String uploadVerificationImage(MultipartFile file) {
    validateImage(file);

    String extension = getAllowedExtension(file.getOriginalFilename());
    String contentType = CONTENT_TYPES_BY_EXTENSION.get(extension);
    String storageKey = "verifications/" + UUID.randomUUID() + "." + extension;

    try {
      S3Client configuredS3Client = s3Client.orElse(null);
      if (configuredS3Client != null) {
        validateR2StorageConfig();
        uploadToR2(configuredS3Client, file, storageKey, contentType);
        return r2PublicUrl + "/" + storageKey;
      }

      return uploadToLocal(file, extension);
    } catch (IOException | RuntimeException e) {
      if (e instanceof BusinessException businessException) {
        throw businessException;
      }
      throw new BusinessException(ErrorStatus.FILE_UPLOAD_FAILED, e);
    }
  }

  private void validateImage(MultipartFile file) {
    if (file == null || file.isEmpty()) {
      throw new BusinessException(ErrorStatus.FILE_EMPTY);
    }

    if (file.getSize() > maxImageSize.toBytes()) {
      throw new BusinessException(ErrorStatus.FILE_TOO_LARGE);
    }

    String extension = getAllowedExtension(file.getOriginalFilename());
    String expectedContentType = CONTENT_TYPES_BY_EXTENSION.get(extension);
    if (!expectedContentType.equalsIgnoreCase(
        Optional.ofNullable(file.getContentType()).orElse(""))) {
      throw new BusinessException(ErrorStatus.FILE_INVALID_TYPE);
    }

    try (InputStream inputStream = file.getInputStream()) {
      BufferedImage image = ImageIO.read(inputStream);
      if (image == null) {
        throw new BusinessException(ErrorStatus.FILE_INVALID_IMAGE);
      }
    } catch (IOException e) {
      throw new BusinessException(ErrorStatus.FILE_INVALID_IMAGE, e);
    }
  }

  private String getAllowedExtension(String originalFilename) {
    String filename = Optional.ofNullable(originalFilename).orElse("");
    int dotIndex = filename.lastIndexOf('.');
    if (dotIndex < 0 || dotIndex == filename.length() - 1) {
      throw new BusinessException(ErrorStatus.FILE_INVALID_TYPE);
    }

    String extension = filename.substring(dotIndex + 1).toLowerCase(Locale.ROOT);
    if (!ALLOWED_EXTENSIONS.contains(extension)) {
      throw new BusinessException(ErrorStatus.FILE_INVALID_TYPE);
    }
    return extension;
  }

  private void validateR2StorageConfig() {
    if (r2Bucket.isBlank() || r2PublicUrl.isBlank()) {
      throw new BusinessException(ErrorStatus.FILE_STORAGE_CONFIG_INVALID);
    }
  }

  private void uploadToR2(
      S3Client configuredS3Client, MultipartFile file, String storageKey, String contentType)
      throws IOException {
    configuredS3Client.putObject(
        PutObjectRequest.builder()
            .bucket(r2Bucket)
            .key(storageKey)
            .contentType(contentType)
            .build(),
        RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
  }

  private String uploadToLocal(MultipartFile file, String extension) throws IOException {
    String localName = UUID.randomUUID() + "." + extension;
    Path dir = Paths.get(uploadDir).toAbsolutePath().normalize();
    Files.createDirectories(dir);
    Path target = dir.resolve(localName).normalize();
    if (!target.startsWith(dir)) {
      throw new BusinessException(ErrorStatus.FILE_UPLOAD_FAILED);
    }
    file.transferTo(target);
    return "/uploads/" + localName;
  }
}
