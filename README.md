# Attendance2Day – College Academic Management System
Check out the live app ([https://play.google.com/store/apps](https://play.google.com/store/apps/details?id=com.attendance2day.att2&hl=en_IN)).
### Every Day Counts: Attend to Achieve!

Attendance2Day is a role-based College Academic Management System designed to
digitally manage and monitor important academic activities within a college.

The application provides different functionalities for administrators,
faculty members, examination staff, and students through role-based access.

It helps colleges manage students, faculty, attendance, timetables,
assignments, study materials, internal marks, examinations, results,
notifications, and payment records from a centralized system.

---

## 📌 Project Overview

Attendance2Day was developed to provide a centralized digital platform for
managing day-to-day academic activities in an educational institution.

The system supports multiple user roles, where each role has specific
responsibilities and access to relevant academic functions.

Instead of maintaining academic information across multiple systems or
manual processes, Attendance2Day brings major college activities together
within one application.

---

## 🎯 Objectives

The primary objectives of Attendance2Day are:

- Digitize college academic management processes
- Provide role-based access to different users
- Simplify student and faculty management
- Record and monitor student attendance
- Manage class schedules and timetables
- Share assignments and study materials
- Manage internal and external marks
- Provide examination and result management
- Send academic notifications to students
- Maintain student payment records
- Provide students with easy access to academic information

---

## 🚀 Key Features

### 👨‍💼 College Management

- College registration
- College information management
- College-specific identification
- User monitoring within the college
- Role-based access management

### 👨‍🎓 Student Management

- Student registration
- Student self-signup using a unique college code
- Student monitoring
- Student activation/deactivation
- Attendance tracking
- Academic information access

### 👨‍🏫 Faculty Management

- Faculty monitoring
- Department-level management
- Class attendance recording
- Timetable management
- Assignment management
- Study material uploads
- Internal marks management
- Student notifications

### 🏫 HOD Management

- Department monitoring
- Student monitoring
- Faculty monitoring
- Attendance management
- Class timetable management
- Academic activity supervision

### 📝 Examination Management

- Examination timetable scheduling
- External marks management
- Semester result management
- Revaluation requests
- Recounting requests
- Result publishing

### 🔔 Notification Management

The system provides notifications to students for important academic
information and activities.

### 💰 Payment Records

Administrators can maintain student payment records and monitor relevant
student information.

---

# 👥 User Roles

Attendance2Day follows a role-based architecture.

| Role | Main Responsibilities |
|------|------------------------|
| Founder / Chairman | College registration and college management |
| Chancellor | Monitor college academic activities |
| Vice Chancellor | Monitor students and staff |
| Director | Monitor academic activities |
| Dean | Monitor academic activities |
| Principal | Monitor students and staff |
| Vice Principal | Monitor students and staff |
| Admin | Student, staff and payment management |
| HOD | Department and faculty management |
| Faculty | Attendance, assignments, materials and marks |
| Examination Staff | Exams, marks, results and revaluation |
| Student | Attendance, timetable, materials and results |

---

# 🔐 Role-Based Access

Different users receive different capabilities based on their assigned role.

For example:

- Students can view their academic information.
- Faculty members can record attendance and manage academic content.
- HODs can monitor department-level activities.
- Administrators can manage students and payment records.
- Examination staff can manage examinations and results.
- Senior management can monitor students and staff.

This approach helps keep the system organized and prevents every user from
accessing functions that are outside their responsibilities.

---

# 🔄 College Registration & Signup Flow

The application uses a college-specific registration process.

### Founder / Chairman

1. Founder creates an account.
2. College is registered in the system.
3. A unique college code is generated.
4. The unique code is provided through the confirmation email.
5. The college can then onboard users.

### Students

Students can register using the unique college code associated with their
college.

This allows the system to associate students with the correct institution.

---

# 📊 Academic Management

Attendance2Day brings multiple academic activities into one platform.

### Attendance

Faculty members can record student attendance for their classes.

Students can then track their attendance through the application.

### Timetable

Faculty/HOD users can manage class schedules and timetables.

Students can view their class timetable.

### Assignments

Faculty members can upload assignments and provide academic information
to students.

### Study Materials

Faculty members can upload study materials that students can access through
the application.

### Internal Marks

Faculty members can upload and manage internal assessment marks.

### Results

Students can access semester results and information related to backlogs.

---

# 📝 Examination Module

The examination-related functionality includes:

- Examination timetable scheduling
- External marks upload
- Result management
- Semester result publishing
- Revaluation requests
- Recounting requests

The module provides examination staff with centralized tools for managing
student examination information.

---

# 🏗️ System Architecture

The application follows a client-server architecture.

```text
                    ┌─────────────────────┐
                    │      Users          │
                    │                     │
                    │ Founder / Admin     │
                    │ HOD / Faculty       │
                    │ Exam Staff / Student│
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Kotlin Android    │
                    │     Application     │
                    └──────────┬──────────┘
                               │
                               │ API Requests
                               ▼
                    ┌─────────────────────┐
                    │     Node.js         │
                    │      Backend        │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │       MySQL         │
                    │      Database       │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │     AWS RDS         │
                    │   Database Hosting  │
                    └─────────────────────┘



<img width="1663" height="833" alt="image" src="https://github.com/user-attachments/assets/056d0bf1-3989-4c13-8f80-ef4f46eadf0c" />

