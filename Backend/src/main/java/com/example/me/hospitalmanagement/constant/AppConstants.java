package com.example.me.hospitalmanagement.constant;

/**
 * Global application constants.
 */
public final class AppConstants {

    private AppConstants() {
        // Prevent instantiation
    }

    /**
     * Spring Security Role Prefix.
     */
    public static final String ROLE_PREFIX = "ROLE_";

    /**
     * Cache name for Doctor entities.
     */
    public static final String DOCTOR_CACHE = "doctors";

    /**
     * Cache name for Department entities.
     */
    public static final String DEPARTMENT_CACHE = "departments";
}
