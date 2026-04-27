package com.colick.backoffice.notification.sms;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

@Service
public class TwilioSmsService implements SmsService {

    private final RestClient restClient;
    private final boolean enabled;
    private final String accountSid;
    private final String authToken;
    private final String fromNumber;

    public TwilioSmsService(RestClient.Builder restClientBuilder,
                            @Value("${app.sms.enabled:false}") boolean enabled,
                            @Value("${app.sms.twilio.account-sid:}") String accountSid,
                            @Value("${app.sms.twilio.auth-token:}") String authToken,
                            @Value("${app.sms.twilio.from-number:}") String fromNumber) {
        this.restClient = restClientBuilder.build();
        this.enabled = enabled;
        this.accountSid = accountSid;
        this.authToken = authToken;
        this.fromNumber = fromNumber;
    }

    @Override
    public void sendValidationCode(String to, String validationCode, String departureAddress, String destination) {
        if (!enabled || accountSid.isBlank() || authToken.isBlank() || fromNumber.isBlank()) {
            throw new IllegalStateException("SMS delivery is not configured");
        }

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("To", to);
        form.add("From", fromNumber);
        form.add("Body", "Colick: votre code de validation pour le trajet %s -> %s est %s."
                .formatted(departureAddress, destination, validationCode));

        restClient.post()
                .uri("https://api.twilio.com/2010-04-01/Accounts/{accountSid}/Messages.json", accountSid)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .headers(headers -> headers.setBasicAuth(accountSid, authToken))
                .body(form)
                .retrieve()
                .toBodilessEntity();
    }
}
