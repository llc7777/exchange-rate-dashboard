package com.leo.exchange.exchange_rate.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.leo.exchange.exchange_rate.exception.InvalidRequestException;
import org.junit.jupiter.api.Test;

class ExternalApiGuardServiceTest {

    private final ExternalApiGuardService guardService = new ExternalApiGuardService();

    @Test
    void userFlowCannotCallExternalApiDirectly() {
        assertThatThrownBy(guardService::assertCallAllowed)
                .isInstanceOf(InvalidRequestException.class);
    }

    @Test
    void adminSyncCanCallExternalApiInsideGuard() {
        String result = guardService.executeAllowed(ExternalApiCallerType.ADMIN, () -> {
            guardService.assertCallAllowed();
            return "allowed";
        });

        assertThat(result).isEqualTo("allowed");
    }

    @Test
    void schedulerCanCallExternalApiInsideGuard() {
        String result = guardService.executeAllowed(ExternalApiCallerType.SCHEDULER, () -> {
            guardService.assertCallAllowed();
            return "allowed";
        });

        assertThat(result).isEqualTo("allowed");
    }
}
