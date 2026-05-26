package com.leo.exchange.exchange_rate.repository;

import com.leo.exchange.exchange_rate.entity.AuthUser;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuthUserRepository extends JpaRepository<AuthUser, Long> {

    Optional<AuthUser> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByName(String name);
}
