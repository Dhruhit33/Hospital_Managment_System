import os
import shutil
import re

base_dir = r"d:\dhruhit\d drive\Project for my resume\HospitalManagmentSyst\Backend"
src_main = os.path.join(base_dir, "src", "main", "java")
src_test = os.path.join(base_dir, "src", "test", "java")

# 1. Clean up any leftover HostelMenagement directories
def merge_and_move(src_root, dst_root):
    if not os.path.exists(src_root):
        return
    for root, dirs, files in os.walk(src_root):
        rel = os.path.relpath(root, src_root)
        target_dir = os.path.join(dst_root, rel)
        os.makedirs(target_dir, exist_ok=True)
        for f in files:
            src_file = os.path.join(root, f)
            dst_file = os.path.join(target_dir, f)
            if os.path.exists(dst_file) and src_file.lower() == dst_file.lower():
                # Case rename on same file
                continue
            elif os.path.exists(dst_file):
                os.remove(dst_file)
            shutil.move(src_file, dst_file)
    shutil.rmtree(src_root, ignore_errors=True)

merge_and_move(os.path.join(src_main, "com", "example", "me", "HostelMenagement"),
               os.path.join(src_main, "com", "example", "me", "hospitalmanagement"))
merge_and_move(os.path.join(src_test, "com", "example", "me", "HostelMenagement"),
               os.path.join(src_test, "com", "example", "me", "hospitalmanagement"))

# Case-safe file rename
file_renames = {
    "Patinet.java": "Patient.java",
    "PatinetDto.java": "PatientDto.java",
    "PatinetRepositry.java": "PatientRepository.java",
    "PatinetController.java": "PatientController.java",
    "PatinetServiceImplement.java": "PatientServiceImpl.java",
    "DoctorServiceImplement.java": "DoctorServiceImpl.java",
    "PermsionType.java": "PermissionType.java",
    "GlobalExeptionHandler.java": "GlobalExceptionHandler.java",
    "OauthSuccessHendeler.java": "OAuth2SuccessHandler.java",
    "Authutil.java": "AuthUtil.java",
    "LoginResponceDto.java": "LoginResponseDto.java",
    "BloodGroupCountResponceEntity.java": "BloodGroupCountResponse.java",
    "OnbordDoctorRequestDto.java": "OnboardDoctorRequestDto.java",
    "HostelMenagementApplication.java": "HospitalManagementApplication.java",
    "HostelMenagementApplicationTests.java": "HospitalManagementApplicationTests.java",
    "InsurenceTest.java": "InsuranceTest.java",
    "PatinetTest.java": "PatientTest.java",
    "PatinetControllerTest.java": "PatientControllerTest.java",
}

for root_dir in [os.path.join(src_main, "com", "example", "me", "hospitalmanagement"),
                 os.path.join(src_test, "com", "example", "me", "hospitalmanagement")]:
    if not os.path.exists(root_dir):
        continue
    for root, dirs, files in os.walk(root_dir):
        for f in files:
            if f in file_renames:
                old_path = os.path.join(root, f)
                new_name = file_renames[f]
                new_path = os.path.join(root, new_name)
                tmp_path = os.path.join(root, f + ".tmp_rename")
                if os.path.exists(old_path):
                    os.rename(old_path, tmp_path)
                    if os.path.exists(new_path):
                        os.remove(new_path)
                    os.rename(tmp_path, new_path)
                    print(f"Renamed: {f} -> {new_name}")

print("File renames completed.")
