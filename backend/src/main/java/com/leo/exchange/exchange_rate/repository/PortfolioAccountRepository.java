package com.leo.exchange.exchange_rate.repository;

import com.leo.exchange.exchange_rate.entity.PortfolioAccount;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PortfolioAccountRepository extends JpaRepository<PortfolioAccount, Long> {

    Optional<PortfolioAccount> findByIdAndUserKey(Long id, String userKey);

    Optional<PortfolioAccount> findFirstByUserKeyOrderByCreatedAtAscIdAsc(String userKey);

    List<PortfolioAccount> findByUserKeyOrderByCreatedAtAscIdAsc(String userKey);

}
