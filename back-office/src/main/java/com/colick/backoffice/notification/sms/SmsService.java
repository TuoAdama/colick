package com.colick.backoffice.notification.sms;

public interface SmsService {

    void sendValidationCode(String to, String validationCode, String departureAddress, String destination);
}
