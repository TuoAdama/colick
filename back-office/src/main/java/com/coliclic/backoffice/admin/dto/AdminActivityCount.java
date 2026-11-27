package com.coliclic.backoffice.admin.dto;

/** Aggregate activity count grouped by user id. */
public interface AdminActivityCount {
    Long getUserId();
    Long getActivityCount();
}
