package com.example.me.hospitalmanagement;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;

@SpringBootApplication
@EnableCaching
@EnableScheduling
public class HospitalManagementApplication {

	public static void main(String[] args) {
        loadEnv();
        SpringApplication.run(HospitalManagementApplication.class, args);
	}

    private static void loadEnv() {
        File[] possibleEnvFiles = new File[]{
                new File(".env"),
                new File("Backend/.env"),
                new File("../.env")
        };

        for (File file : possibleEnvFiles) {
            if (file.exists() && file.isFile()) {
                try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        line = line.trim();
                        if (line.isEmpty() || line.startsWith("#") || !line.contains("=")) {
                            continue;
                        }
                        int eqIdx = line.indexOf('=');
                        String key = line.substring(0, eqIdx).trim();
                        String value = line.substring(eqIdx + 1).trim();
                        if ((value.startsWith("\"") && value.endsWith("\"")) ||
                                (value.startsWith("'") && value.endsWith("'"))) {
                            value = value.substring(1, value.length() - 1);
                        }
                        if (System.getProperty(key) == null && System.getenv(key) == null) {
                            System.setProperty(key, value);
                        }
                    }
                    System.out.println("Loaded environment variables from " + file.getAbsolutePath());
                    break;
                } catch (IOException e) {
                    System.err.println("Could not load .env file: " + e.getMessage());
                }
            }
        }
    }

}

