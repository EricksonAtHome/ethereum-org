package com.erikbank.core.dto;

public record UpdateTransactionStatusRequest(
        String paymentRef,
        String status
) {}
