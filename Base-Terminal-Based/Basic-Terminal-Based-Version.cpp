#include <iostream>
#include <iomanip>
#include <vector>
#include <string>

using namespace std;

class Student {
public:
    string name;
    int rollNumber;
    double marks;
    Student(string n, int r, double m) : name(n), rollNumber(r), marks(m) {}
    void display() const {
        cout << setw(15) << name << setw(10) << rollNumber << setw(8) << setprecision(2) << fixed << marks << endl;
    }
};

void addStudent(vector<Student>& students) {
    string name;
    int rollNumber;
    double marks;

    cout << "Enter student name: ";
    cin.ignore();
    getline(cin, name);

    cout << "Enter roll number: ";
    cin >> rollNumber;

    cout << "Enter marks: ";
    cin >> marks;

    Student newStudent(name, rollNumber, marks);
    students.push_back(newStudent);

    cout << "Student added successfully!\n";
}

void displayAllStudents(const vector<Student>& students) {
    if (students.empty()) {
        cout << "No students in the system.\n";
        return;
    }

    cout << "--------------------------------------\n";
    cout << setw(15) << "Name" << setw(10) << "Roll No" << setw(8) << "Marks\n";
    cout << "--------------------------------------\n";

    for (const auto& student : students) {
        student.display();
    }
}

// Function to display the menu
void displayMenu() {
    cout << "\nStudent Record Management System\n";
    cout << "1. Add Student\n";
    cout << "2. Display All Students\n";
    cout << "3. Exit\n";
    cout << "Enter your choice: ";
}

int main() {
    vector<Student> students;

    int choice;

    do {
        displayMenu();
        cin >> choice;

        switch (choice) {
            case 1:
                addStudent(students);
                break;
            case 2:
                displayAllStudents(students);
                break;
            case 3:
                cout << "Exiting the program. Goodbye!\n";
                break;
            default:
                cout << "Invalid choice. Please try again.\n";
        }
    } while (choice != 3);

    return 0;
}
