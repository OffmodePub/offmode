package com.offmode.global.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Arrays;
import javax.sql.DataSource;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

@ActiveProfiles("dev")
@SpringBootTest
@TestPropertySource(
    properties = {
      "spring.datasource.url=jdbc:h2:mem:flyway-migration-test;MODE=MySQL;DB_CLOSE_DELAY=-1",
      "spring.jpa.hibernate.ddl-auto=validate",
      "spring.flyway.locations=classpath:db/migration/h2",
      "spring.sql.init.mode=never"
    })
class FlywayMigrationTest {

  private final JdbcTemplate jdbcTemplate;
  private final Flyway flyway;

  FlywayMigrationTest(@Autowired DataSource dataSource, @Autowired Flyway flyway) {
    this.jdbcTemplate = new JdbcTemplate(dataSource);
    this.flyway = flyway;
  }

  @Test
  void flywayCreatesSchemaAndSeedsMissionDataBeforeJpaValidation() {
    Integer missionCount =
        jdbcTemplate.queryForObject("SELECT COUNT(*) FROM missions", Integer.class);
    long migrationCount =
        Arrays.stream(flyway.info().applied()).filter(info -> info.getVersion() != null).count();

    assertThat(missionCount).isEqualTo(90);
    assertThat(migrationCount).isEqualTo(2);
  }
}
