package com.coliclic.backoffice.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.InputStream;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.w3c.dom.Document;
import org.w3c.dom.Node;

class LogbackPreprodConfigurationTest {

    private Document configuration;

    @BeforeEach
    void parseConfiguration() throws Exception {
        try (InputStream input = getClass().getResourceAsStream("/logback-spring.xml")) {
            assertThat(input).isNotNull();
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            configuration = factory.newDocumentBuilder().parse(input);
        }
    }

    @Test
    void preprodUsesInfoConsoleAndPersistentFileAppenders() throws Exception {
        Node profile = node("/configuration/springProfile[@name='preprod']");

        assertThat(profile).isNotNull();
        assertThat(text("logger[@name='com.coliclic']/@level", profile)).isEqualTo("INFO");
        assertThat(text("root/@level", profile)).isEqualTo("INFO");
        assertThat(text("root/appender-ref[@ref='CONSOLE']/@ref", profile)).isEqualTo("CONSOLE");
        assertThat(text("root/appender-ref[@ref='PREPROD_FILE']/@ref", profile)).isEqualTo("PREPROD_FILE");
        assertThat(text("appender[@name='PREPROD_FILE']/file", profile)).isEqualTo("${LOG_DIR}/preprod.log");
        assertThat(text("appender[@name='PREPROD_FILE']/rollingPolicy/maxFileSize", profile))
                .isEqualTo("${LOG_MAX_FILE_SIZE}");
        assertThat(text("appender[@name='PREPROD_FILE']/rollingPolicy/maxHistory", profile))
                .isEqualTo("${LOG_MAX_HISTORY}");
        assertThat(text("appender[@name='PREPROD_FILE']/rollingPolicy/totalSizeCap", profile))
                .isEqualTo("${LOG_TOTAL_SIZE_CAP}");
        assertThat(text("logger[starts-with(@name, 'org.hibernate')]/@level", profile)).isEmpty();
    }

    @Test
    void fileLoggingDefaultsMatchPreprodRetentionPolicy() throws Exception {
        assertThat(text("/configuration/springProperty[@name='LOG_DIR']/@defaultValue", configuration))
                .isEqualTo("logs");
        assertThat(text("/configuration/springProperty[@name='LOG_MAX_FILE_SIZE']/@defaultValue", configuration))
                .isEqualTo("20MB");
        assertThat(text("/configuration/springProperty[@name='LOG_MAX_HISTORY']/@defaultValue", configuration))
                .isEqualTo("7");
        assertThat(text("/configuration/springProperty[@name='LOG_TOTAL_SIZE_CAP']/@defaultValue", configuration))
                .isEqualTo("200MB");
        assertThat(text("/configuration/property[@name='LOG_PATTERN']/@value", configuration))
                .contains("yyyy-MM-dd'T'HH:mm:ss.SSSXXX", "%-5level", "%logger");
    }

    private Node node(String expression) throws Exception {
        return (Node) XPathFactory.newInstance().newXPath()
                .evaluate(expression, configuration, XPathConstants.NODE);
    }

    private String text(String expression, Object context) throws Exception {
        return XPathFactory.newInstance().newXPath().evaluate(expression, context).trim();
    }
}
