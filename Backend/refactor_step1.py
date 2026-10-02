import os
import shutil
import re

base_dir = r"d:\dhruhit\d drive\Project for my resume\HospitalManagmentSyst\Backend"
src_main = os.path.join(base_dir, "src", "main", "java")
src_test = os.path.join(base_dir, "src", "test", "java")

# 1. Unify directory paths
# Move src/main/java/com/example/me/HostelMenagement to src/main/java/com/example/me/hospitalmanagement
old_main = os.path.join(src_main, "com", "example", "me", "HostelMenagement")
new_main = os.path.join(src_main, "com", "example", "me", "hospitalmanagement")

old_test = os.path.join(src_test, "com", "example", "me", "HostelMenagement")
new_test = os.path.join(src_test, "com", "example", "me", "hospitalmanagement")

# Let's copy/merge all files from old_main into new_main, then remove old_main
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
            if os.path.exists(dst_file):
                os.remove(dst_file)
            shutil.move(src_file, dst_file)
    shutil.rmtree(src_root)

merge_and_move(old_main, new_main)
merge_and_move(old_test, new_test)

# In new_main and new_test, handle subpackage folder renames:
# Security -> security
# repositry -> repository
# service/Implement -> service/impl
for root_dir in [new_main, new_test]:
    sec_old = os.path.join(root_dir, "Security")
    sec_new = os.path.join(root_dir, "security")
    sec_temp = os.path.join(root_dir, "security_temp")
    if os.path.exists(sec_old):
        os.rename(sec_old, sec_temp)
        if os.path.exists(sec_new):
            merge_and_move(sec_temp, sec_new)
        else:
            os.rename(sec_temp, sec_new)

    rep_old = os.path.join(root_dir, "repositry")
    rep_new = os.path.join(root_dir, "repository")
    if os.path.exists(rep_old):
        if os.path.exists(rep_new):
            merge_and_move(rep_old, rep_new)
        else:
            os.rename(rep_old, rep_new)

    impl_old = os.path.join(root_dir, "service", "Implement")
    impl_new = os.path.join(root_dir, "service", "impl")
    if os.path.exists(impl_old):
        if os.path.exists(impl_new):
            merge_and_move(impl_old, impl_new)
        else:
            os.rename(impl_old, impl_new)

# File renames mapping
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

for root_dir in [new_main, new_test]:
    for root, dirs, files in os.walk(root_dir):
        for f in files:
            if f in file_renames:
                old_path = os.path.join(root, f)
                new_path = os.path.join(root, file_renames[f])
                if os.path.exists(new_path):
                    os.remove(new_path)
                shutil.move(old_path, new_path)

print("Directories and files renamed successfully.")
