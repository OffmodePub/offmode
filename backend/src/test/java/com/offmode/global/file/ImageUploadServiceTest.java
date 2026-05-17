package com.offmode.global.file;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.offmode.global.exception.BusinessException;
import com.offmode.global.status.ErrorStatus;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;
import java.util.stream.Stream;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.util.unit.DataSize;

class ImageUploadServiceTest {

  @TempDir Path tempDir;

  @Test
  void uploadVerificationImageStoresValidPngLocally() throws Exception {
    ImageUploadService service = createService();
    MockMultipartFile file = new MockMultipartFile("photo", "mission.png", "image/png", pngBytes());

    String url = service.uploadVerificationImage(file);

    assertThat(url).startsWith("/uploads/").endsWith(".png");
    try (Stream<Path> storedFiles = Files.list(tempDir)) {
      assertThat(storedFiles).hasSize(1);
    }
  }

  @Test
  void uploadVerificationImageRejectsUnsupportedExtension() {
    ImageUploadService service = createService();
    MockMultipartFile file =
        new MockMultipartFile("photo", "mission.txt", "text/plain", "not-image".getBytes());

    assertThatThrownBy(() -> service.uploadVerificationImage(file))
        .isInstanceOfSatisfying(
            BusinessException.class,
            e -> assertThat(e.getErrorStatus()).isEqualTo(ErrorStatus.FILE_INVALID_TYPE));
  }

  @Test
  void uploadVerificationImageRejectsNonImageBytes() {
    ImageUploadService service = createService();
    MockMultipartFile file =
        new MockMultipartFile("photo", "mission.png", "image/png", "not-image".getBytes());

    assertThatThrownBy(() -> service.uploadVerificationImage(file))
        .isInstanceOfSatisfying(
            BusinessException.class,
            e -> assertThat(e.getErrorStatus()).isEqualTo(ErrorStatus.FILE_INVALID_IMAGE));
  }

  @Test
  void uploadVerificationImageRejectsTooLargeFile() throws Exception {
    ImageUploadService service = createService(DataSize.ofBytes(1));
    MockMultipartFile file = new MockMultipartFile("photo", "mission.png", "image/png", pngBytes());

    assertThatThrownBy(() -> service.uploadVerificationImage(file))
        .isInstanceOfSatisfying(
            BusinessException.class,
            e -> assertThat(e.getErrorStatus()).isEqualTo(ErrorStatus.FILE_TOO_LARGE));
  }

  private ImageUploadService createService() {
    return createService(DataSize.ofMegabytes(10));
  }

  private ImageUploadService createService(DataSize maxImageSize) {
    ImageUploadService service = new ImageUploadService(Optional.empty());
    ReflectionTestUtils.setField(service, "uploadDir", tempDir.toString());
    ReflectionTestUtils.setField(service, "r2Bucket", "");
    ReflectionTestUtils.setField(service, "r2PublicUrl", "");
    ReflectionTestUtils.setField(service, "maxImageSize", maxImageSize);
    return service;
  }

  private byte[] pngBytes() throws Exception {
    BufferedImage image = new BufferedImage(1, 1, BufferedImage.TYPE_INT_RGB);
    ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
    ImageIO.write(image, "png", outputStream);
    return outputStream.toByteArray();
  }
}
