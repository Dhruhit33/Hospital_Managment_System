package com.example.me.hospitalmanagement.dto;

import com.example.me.hospitalmanagement.entity.type.BloodGroup;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BloodGroupCountResponse {
    private BloodGroup bloodGroup;
    private Long count;

}
