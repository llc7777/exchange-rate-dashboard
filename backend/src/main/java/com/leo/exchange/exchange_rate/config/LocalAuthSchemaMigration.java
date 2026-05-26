package com.leo.exchange.exchange_rate.config;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import javax.sql.DataSource;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Profile("local")
@RequiredArgsConstructor
public class LocalAuthSchemaMigration implements ApplicationRunner {

    private final DataSource dataSource;
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (!isMySql()) {
            return;
        }

        // 기존 로컬 볼륨의 name 컬럼도 대소문자를 구분하도록 보정한다.
        // Adjusts the existing local volume's name column to compare values case-sensitively.
        jdbcTemplate.execute("""
                ALTER TABLE auth_users
                MODIFY name varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL
                """);
        log.info("Ensured auth_users.name uses case-sensitive collation for local MySQL.");
    }

    private boolean isMySql() throws Exception {
        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();
            return metaData.getDatabaseProductName().toLowerCase().contains("mysql");
        }
    }
}
