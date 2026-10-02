package com.example.me.hospitalmanagement.dto;

import com.example.me.hospitalmanagement.entity.type.BloodGroup;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UpdatePatientProfileDto {

    @Size(max = 100, message = "Name must not exceed 100 characters")
    private String name;

    @Past(message = "Birth date must be in the past")
    private LocalDate birthDate;

    @Pattern(regexp = "^(Male|Female|Other)?$", message = "Gender must be Male, Female, or Other")
    private String gender;

    private BloodGroup bloodGroup;
}
