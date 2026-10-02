import os
import re

base_dir = r"d:\dhruhit\d drive\Project for my resume\HospitalManagmentSyst\Backend"

# Exact replacements to apply across all java, yml, and xml files
replacements = [
    # Packages
    ("com.example.me.HostelMenagement", "com.example.me.hospitalmanagement"),
    ("com.example.me.hospitalmanagement.repositry", "com.example.me.hospitalmanagement.repository"),
    ("com.example.me.hospitalmanagement.Security", "com.example.me.hospitalmanagement.security"),
    ("com.example.me.hospitalmanagement.service.Implement", "com.example.me.hospitalmanagement.service.impl"),
    
    # Types
    ("PatinetRepositry", "PatientRepository"),
    ("PatinetControllerTest", "PatientControllerTest"),
    ("PatinetController", "PatientController"),
    ("PatinetServiceImplement", "PatientServiceImpl"),
    ("DoctorServiceImplement", "DoctorServiceImpl"),
    ("PatinetDto", "PatientDto"),
    ("PermsionType", "PermissionType"),
    ("GlobalExeptionHandler", "GlobalExceptionHandler"),
    ("OauthSuccessHendeler", "OAuth2SuccessHandler"),
    ("Authutil", "AuthUtil"),
    ("LoginResponceDto", "LoginResponseDto"),
    ("BloodGroupCountResponceEntity", "BloodGroupCountResponse"),
    ("OnbordDoctorRequestDto", "OnboardDoctorRequestDto"),
    ("HostelMenagementApplicationTests", "HospitalManagementApplicationTests"),
    ("HostelMenagementApplication", "HospitalManagementApplication"),
    ("InsurenceTest", "InsuranceTest"),
    ("PatinetTest", "PatientTest"),
    
    # Methods
    ("genrateAccesssTokan", "generateAccessToken"),
    ("getUsernameFromTokan", "getUsernameFromToken"),
    ("detrmineUsernameFromOAuth2User", "determineUsernameFromOAuth2User"),
    ("getPatinetId", "getPatientId"),
    ("AddPatinet", "addPatient"),
    ("findByAppointment_Patinet_Id", "findByAppointment_Patient_Id"),
    ("existsByDoctorIdAndPatinetId", "existsByDoctorIdAndPatientId"),
    ("findAllByPatinet_Id", "findAllByPatient_Id"),
    ("findAllByPatinetId", "findAllByPatientId"),
    ("getPatinet", "getPatient"),
    ("setPatinet", "setPatient"),
    
    # Fields/Variables
    ("patinetRepositry", "patientRepository"),
    ("patinetDto", "patientDto"),
    ("patinetId", "patientId"),
    ("patinet1", "patient1"),
    ("patinet2", "patient2"),
    ("patinet", "patient"),
    ("Patinet", "Patient"),

    # Table and Endpoints
    ('name = "patinet"', 'name = "patient"'),
    ('/admin/patinets', '/admin/patients'),
]

extensions = ('.java', '.yml', '.yaml', '.xml', '.sql', '.properties')

for root, dirs, files in os.walk(base_dir):
    if 'target' in root or '.git' in root or '.idea' in root:
        continue
    for f in files:
        if f.endswith(extensions):
            file_path = os.path.join(root, f)
            try:
                with open(file_path, 'r', encoding='utf-8') as fl:
                    content = fl.read()
                
                new_content = content
                for old_val, new_val in replacements:
                    new_content = new_content.replace(old_val, new_val)
                
                if new_content != content:
                    with open(file_path, 'w', encoding='utf-8') as fl:
                        fl.write(new_content)
                    print(f"Updated references in {file_path}")
            except Exception as e:
                print(f"Error updating {file_path}: {e}")

print("References update completed.")
