class StudentManager {
    constructor() {
        this.students = this.loadStudents();
        this.activity = this.loadActivity();
        this.currentEditingId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.showSection('dashboard');
        this.updateDashboard();
        this.renderStudents();
        this.renderActivity();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.target.dataset.section;
                this.showSection(section);
            });
        });

        // Student form submission
        document.getElementById('student-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addStudent();
        });

        // Edit form submission
        document.getElementById('edit-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEditedStudent();
        });

        // Search functionality
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.searchStudents(e.target.value);
        });

        // Export functionality
        document.getElementById('export-btn').addEventListener('click', () => {
            this.exportData();
        });

        // Modal controls
        document.getElementById('close-modal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('cancel-edit').addEventListener('click', () => {
            this.closeModal();
        });

        // Close modal when clicking outside
        document.getElementById('edit-modal').addEventListener('click', (e) => {
            if (e.target.id === 'edit-modal') {
                this.closeModal();
            }
        });
    }

    showSection(sectionId) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');

        // Update sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionId).classList.add('active');

        // Update data when switching sections
        if (sectionId === 'dashboard') {
            this.updateDashboard();
        } else if (sectionId === 'reports') {
            this.updateReports();
        }
    }

    addStudent() {
        const form = document.getElementById('student-form');
        const formData = new FormData(form);
        
        const student = {
            id: this.generateId(),
            name: formData.get('student-name') || document.getElementById('student-name').value,
            rollNumber: parseInt(formData.get('roll-number') || document.getElementById('roll-number').value),
            email: formData.get('email') || document.getElementById('email').value,
            phone: formData.get('phone') || document.getElementById('phone').value,
            course: formData.get('course') || document.getElementById('course').value,
            marks: parseFloat(formData.get('marks') || document.getElementById('marks').value),
            grade: this.calculateGrade(parseFloat(formData.get('marks') || document.getElementById('marks').value)),
            dateAdded: new Date().toLocaleDateString()
        };

        // Validate required fields
        if (!student.name || !student.rollNumber || !student.email || !student.course || isNaN(student.marks)) {
            this.showAlert('Please fill in all required fields', 'error');
            return;
        }

        // Check for duplicate roll number
        if (this.students.some(s => s.rollNumber === student.rollNumber)) {
            this.showAlert('Roll number already exists', 'error');
            return;
        }

        // Validate email format
        if (!this.isValidEmail(student.email)) {
            this.showAlert('Please enter a valid email address', 'error');
            return;
        }

        // Validate marks range
        if (student.marks < 0 || student.marks > 100) {
            this.showAlert('Marks must be between 0 and 100', 'error');
            return;
        }

        this.students.push(student);
        this.saveStudents();
        this.addActivity(`Added student: ${student.name}`);
        this.showAlert('Student added successfully!', 'success');
        
        form.reset();
        this.renderStudents();
        this.updateDashboard();
    }

    editStudent(id) {
        const student = this.students.find(s => s.id === id);
        if (!student) return;

        this.currentEditingId = id;
        
        // Populate edit form
        document.getElementById('edit-name').value = student.name;
        document.getElementById('edit-roll').value = student.rollNumber;
        document.getElementById('edit-email').value = student.email;
        document.getElementById('edit-phone').value = student.phone || '';
        document.getElementById('edit-course').value = student.course;
        document.getElementById('edit-marks').value = student.marks;

        // Show modal
        document.getElementById('edit-modal').style.display = 'block';
    }

    saveEditedStudent() {
        const student = this.students.find(s => s.id === this.currentEditingId);
        if (!student) return;

        const newRollNumber = parseInt(document.getElementById('edit-roll').value);
        const newMarks = parseFloat(document.getElementById('edit-marks').value);

        // Check for duplicate roll number (excluding current student)
        if (this.students.some(s => s.rollNumber === newRollNumber && s.id !== this.currentEditingId)) {
            this.showAlert('Roll number already exists', 'error');
            return;
        }

        // Validate email format
        const newEmail = document.getElementById('edit-email').value;
        if (!this.isValidEmail(newEmail)) {
            this.showAlert('Please enter a valid email address', 'error');
            return;
        }

        // Update student
        student.name = document.getElementById('edit-name').value;
        student.rollNumber = newRollNumber;
        student.email = newEmail;
        student.phone = document.getElementById('edit-phone').value;
        student.course = document.getElementById('edit-course').value;
        student.marks = newMarks;
        student.grade = this.calculateGrade(newMarks);

        this.saveStudents();
        this.addActivity(`Updated student: ${student.name}`);
        this.showAlert('Student updated successfully!', 'success');
        
        this.closeModal();
        this.renderStudents();
        this.updateDashboard();
    }

    deleteStudent(id) {
        const student = this.students.find(s => s.id === id);
        if (!student) return;

        if (confirm(`Are you sure you want to delete ${student.name}?`)) {
            this.students = this.students.filter(s => s.id !== id);
            this.saveStudents();
            this.addActivity(`Deleted student: ${student.name}`);
            this.showAlert('Student deleted successfully!', 'success');
            
            this.renderStudents();
            this.updateDashboard();
        }
    }

    renderStudents(studentsToRender = this.students) {
        const tbody = document.getElementById('students-tbody');
        
        if (studentsToRender.length === 0) {
            tbody.innerHTML = '<tr class="no-records"><td colspan="7">No students found</td></tr>';
            return;
        }

        tbody.innerHTML = studentsToRender.map(student => `
            <tr>
                <td>${student.name}</td>
                <td>${student.rollNumber}</td>
                <td>${student.email}</td>
                <td>${student.course}</td>
                <td>${student.marks}</td>
                <td><span class="grade-badge grade-${student.grade}">${student.grade}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-edit" onclick="studentManager.editStudent('${student.id}')">Edit</button>
                        <button class="btn btn-delete" onclick="studentManager.deleteStudent('${student.id}')">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    searchStudents(query) {
        if (!query.trim()) {
            this.renderStudents();
            return;
        }

        const filtered = this.students.filter(student => 
            student.name.toLowerCase().includes(query.toLowerCase()) ||
            student.rollNumber.toString().includes(query) ||
            student.email.toLowerCase().includes(query.toLowerCase()) ||
            student.course.toLowerCase().includes(query.toLowerCase())
        );

        this.renderStudents(filtered);
    }

    updateDashboard() {
        if (this.students.length === 0) {
            document.getElementById('total-students').textContent = '0';
            document.getElementById('average-grade').textContent = '0.0';
            document.getElementById('highest-score').textContent = '0';
            document.getElementById('lowest-score').textContent = '0';
            return;
        }

        const totalStudents = this.students.length;
        const marks = this.students.map(s => s.marks);
        const avgMarks = marks.reduce((a, b) => a + b, 0) / totalStudents;
        const highestScore = Math.max(...marks);
        const lowestScore = Math.min(...marks);

        document.getElementById('total-students').textContent = totalStudents;
        document.getElementById('average-grade').textContent = avgMarks.toFixed(1);
        document.getElementById('highest-score').textContent = highestScore;
        document.getElementById('lowest-score').textContent = lowestScore;
    }

    updateReports() {
        this.updateGradeChart();
        this.updateCourseStats();
    }

    updateGradeChart() {
        const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
        
        this.students.forEach(student => {
            gradeDistribution[student.grade]++;
        });

        const totalStudents = this.students.length;
        const maxCount = Math.max(...Object.values(gradeDistribution));

        Object.entries(gradeDistribution).forEach(([grade, count]) => {
            const gradeBar = document.querySelector(`.grade-bar[data-grade="${grade}"]`);
            const bar = gradeBar.querySelector('.bar');
            const countElement = gradeBar.querySelector('.grade-count');
            
            const percentage = totalStudents > 0 ? (count / totalStudents) * 100 : 0;
            bar.style.width = `${percentage}%`;
            countElement.textContent = count;
        });
    }

    updateCourseStats() {
        const courseStats = {};
        
        this.students.forEach(student => {
            if (!courseStats[student.course]) {
                courseStats[student.course] = { total: 0, sum: 0, count: 0 };
            }
            courseStats[student.course].sum += student.marks;
            courseStats[student.course].count++;
        });

        const statsElement = document.getElementById('course-stats');
        
        if (Object.keys(courseStats).length === 0) {
            statsElement.innerHTML = '<p>No data available</p>';
            return;
        }

        const statsHTML = Object.entries(courseStats)
            .map(([course, stats]) => {
                const average = (stats.sum / stats.count).toFixed(1);
                return `
                    <div class="course-stat">
                        <strong>${course}</strong>
                        <span>Average: ${average} (${stats.count} students)</span>
                    </div>
                `;
            })
            .join('');

        statsElement.innerHTML = statsHTML;
    }

    renderActivity() {
        const activityList = document.getElementById('activity-list');
        
        if (this.activity.length === 0) {
            activityList.innerHTML = '<p class="no-activity">No recent activity</p>';
            return;
        }

        const recentActivity = this.activity.slice(-5).reverse();
        activityList.innerHTML = recentActivity.map(activity => `
            <div class="activity-item">${activity}</div>
        `).join('');
    }

    addActivity(message) {
        const timestamp = new Date().toLocaleString();
        this.activity.push(`${timestamp}: ${message}`);
        this.saveActivity();
        this.renderActivity();
    }

    exportData() {
        if (this.students.length === 0) {
            this.showAlert('No data to export', 'info');
            return;
        }

        const csvContent = this.convertToCSV(this.students);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `student_records_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.showAlert('Data exported successfully!', 'success');
        } else {
            this.showAlert('Export not supported in this browser', 'error');
        }
    }

    convertToCSV(data) {
        const headers = ['Name', 'Roll Number', 'Email', 'Phone', 'Course', 'Marks', 'Grade', 'Date Added'];
        const rows = data.map(student => [
            student.name,
            student.rollNumber,
            student.email,
            student.phone || '',
            student.course,
            student.marks,
            student.grade,
            student.dateAdded
        ]);

        return [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');
    }

    calculateGrade(marks) {
        if (marks >= 90) return 'A';
        if (marks >= 80) return 'B';
        if (marks >= 70) return 'C';
        if (marks >= 60) return 'D';
        return 'F';
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    closeModal() {
        document.getElementById('edit-modal').style.display = 'none';
        this.currentEditingId = null;
    }

    showAlert(message, type) {
        // Remove existing alerts
        document.querySelectorAll('.alert').forEach(alert => alert.remove());

        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;

        const content = document.querySelector('.content');
        content.insertBefore(alert, content.firstChild);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            alert.remove();
        }, 5000);
    }

    // Data persistence
    saveStudents() {
        localStorage.setItem('studentRecords', JSON.stringify(this.students));
    }

    loadStudents() {
        const saved = localStorage.getItem('studentRecords');
        return saved ? JSON.parse(saved) : [];
    }

    saveActivity() {
        localStorage.setItem('studentActivity', JSON.stringify(this.activity));
    }

    loadActivity() {
        const saved = localStorage.getItem('studentActivity');
        return saved ? JSON.parse(saved) : [];
    }

    // Demo data for testing
    addDemoData() {
        if (this.students.length > 0) {
            this.showAlert('Demo data already exists or students are present', 'info');
            return;
        }

        const demoStudents = [
            { name: 'Alice Johnson', rollNumber: 1001, email: 'alice@email.com', phone: '123-456-7890', course: 'Computer Science', marks: 92 },
            { name: 'Bob Smith', rollNumber: 1002, email: 'bob@email.com', phone: '123-456-7891', course: 'Mathematics', marks: 78 },
            { name: 'Charlie Brown', rollNumber: 1003, email: 'charlie@email.com', phone: '123-456-7892', course: 'Physics', marks: 85 },
            { name: 'Diana Wilson', rollNumber: 1004, email: 'diana@email.com', phone: '123-456-7893', course: 'Chemistry', marks: 67 },
            { name: 'Eve Davis', rollNumber: 1005, email: 'eve@email.com', phone: '123-456-7894', course: 'Biology', marks: 94 }
        ];

        demoStudents.forEach(demo => {
            const student = {
                id: this.generateId(),
                ...demo,
                grade: this.calculateGrade(demo.marks),
                dateAdded: new Date().toLocaleDateString()
            };
            this.students.push(student);
        });

        this.saveStudents();
        this.addActivity('Added demo data');
        this.showAlert('Demo data added successfully!', 'success');
        this.renderStudents();
        this.updateDashboard();
    }

    // Clear all data
    clearAllData() {
        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            this.students = [];
            this.activity = [];
            this.saveStudents();
            this.saveActivity();
            this.renderStudents();
            this.updateDashboard();
            this.renderActivity();
            this.showAlert('All data cleared successfully!', 'info');
        }
    }
}

// Theme Management
class ThemeManager {
    constructor() {
        this.init();
    }

    init() {
        // Set default theme to dark
        const savedTheme = localStorage.getItem('theme') || 'dark';
        this.setTheme(savedTheme);
        this.setupThemeToggle();
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        this.updateThemeIcon(theme);
    }

    updateThemeIcon(theme) {
        const themeIcon = document.getElementById('theme-icon');
        if (themeIcon) {
            themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
        
        // Add a subtle animation to the body
        document.body.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        setTimeout(() => {
            document.body.style.transition = '';
        }, 300);
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    }
}

// Enhanced Student Manager with C++ Integration
class StudentManagerWithCpp extends StudentManager {
    constructor() {
        super();
        this.setupCppSection();
    }

    setupCppSection() {
        // Add syntax highlighting for code blocks
        this.addCodeHighlighting();
        
        // Add copy to clipboard functionality
        this.addCopyFunctionality();
        
        // Add C++ compilation tips
        this.addCompilationTips();
    }

    addCodeHighlighting() {
        // Simple syntax highlighting for C++ keywords
        const cppKeywords = ['class', 'public', 'private', 'const', 'std', 'string', 'int', 'double', 'void', 'return', 'if', 'else'];
        const jsKeywords = ['class', 'constructor', 'const', 'let', 'var', 'function', 'return', 'if', 'else', 'this'];
        
        document.querySelectorAll('.cpp-code').forEach(block => {
            let content = block.innerHTML;
            cppKeywords.forEach(keyword => {
                const regex = new RegExp(`\\b${keyword}\\b`, 'g');
                content = content.replace(regex, `<span style="color: #667eea; font-weight: 600;">${keyword}</span>`);
            });
            block.innerHTML = content;
        });

        document.querySelectorAll('.js-code').forEach(block => {
            let content = block.innerHTML;
            jsKeywords.forEach(keyword => {
                const regex = new RegExp(`\\b${keyword}\\b`, 'g');
                content = content.replace(regex, `<span style="color: #667eea; font-weight: 600;">${keyword}</span>`);
            });
            block.innerHTML = content;
        });
    }

    addCopyFunctionality() {
        document.querySelectorAll('.code-block').forEach(block => {
            const copyBtn = document.createElement('button');
            copyBtn.innerHTML = '📋 Copy';
            copyBtn.className = 'btn btn-secondary';
            copyBtn.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                padding: 0.5rem 1rem;
                font-size: 0.8rem;
                opacity: 0.7;
                transition: opacity 0.2s ease;
            `;
            
            copyBtn.addEventListener('click', () => {
                const code = block.querySelector('code').innerText;
                navigator.clipboard.writeText(code).then(() => {
                    copyBtn.innerHTML = '✅ Copied!';
                    setTimeout(() => {
                        copyBtn.innerHTML = '📋 Copy';
                    }, 2000);
                });
            });

            block.style.position = 'relative';
            block.appendChild(copyBtn);
            
            // Show copy button on hover
            block.addEventListener('mouseenter', () => {
                copyBtn.style.opacity = '1';
            });
            
            block.addEventListener('mouseleave', () => {
                copyBtn.style.opacity = '0.7';
            });
        });
    }

    addCompilationTips() {
        const cppSection = document.getElementById('cpp-code');
        if (cppSection) {
            const tipsContainer = document.createElement('div');
            tipsContainer.className = 'compilation-tips';
            tipsContainer.innerHTML = `
                <h3>💡 C++ Development Tips</h3>
                <div class="tips-grid">
                    <div class="tip-card">
                        <h4>🔧 Compiler Flags</h4>
                        <p>Use <code>-std=c++17</code> or <code>-std=c++20</code> for modern C++ features</p>
                    </div>
                    <div class="tip-card">
                        <h4>🐛 Debug Mode</h4>
                        <p>Add <code>-g -O0</code> for debugging with GDB or IDE debuggers</p>
                    </div>
                    <div class="tip-card">
                        <h4>⚡ Performance</h4>
                        <p>Use <code>-O2</code> or <code>-O3</code> for optimized release builds</p>
                    </div>
                    <div class="tip-card">
                        <h4>📦 Memory Check</h4>
                        <p>Use <code>valgrind</code> or <code>-fsanitize=address</code> for memory debugging</p>
                    </div>
                </div>
            `;
            
            cppSection.appendChild(tipsContainer);
        }
    }

    // Override showSection to handle C++ code section
    showSection(sectionId) {
        super.showSection(sectionId);
        
        if (sectionId === 'cpp-code') {
            // Re-apply syntax highlighting when section is shown
            setTimeout(() => {
                this.addCodeHighlighting();
            }, 100);
        }
    }
}

// Initialize the application
let studentManager;
let themeManager;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme manager first
    themeManager = new ThemeManager();
    
    // Initialize enhanced student manager
    studentManager = new StudentManagerWithCpp();
    
    // Add demo data button to dashboard (for testing)
    if (document.getElementById('dashboard')) {
        const demoButton = document.createElement('button');
        demoButton.textContent = 'Add Demo Data';
        demoButton.className = 'btn btn-secondary';
        demoButton.style.marginRight = '10px';
        demoButton.onclick = () => studentManager.addDemoData();
        
        const clearButton = document.createElement('button');
        clearButton.textContent = 'Clear All Data';
        clearButton.className = 'btn btn-danger';
        clearButton.onclick = () => studentManager.clearAllData();
        
        const buttonContainer = document.createElement('div');
        buttonContainer.style.marginTop = '20px';
        buttonContainer.appendChild(demoButton);
        buttonContainer.appendChild(clearButton);
        
        document.getElementById('dashboard').appendChild(buttonContainer);
    }
});

// Add some helper functions for better UX
document.addEventListener('keydown', (e) => {
    // Close modal with Escape key
    if (e.key === 'Escape') {
        const modal = document.getElementById('edit-modal');
        if (modal.style.display === 'block') {
            studentManager.closeModal();
        }
    }
});

// Add form validation styling
document.addEventListener('input', (e) => {
    if (e.target.matches('input[required], select[required]')) {
        if (e.target.value.trim() === '') {
            e.target.style.borderColor = '#ef4444';
        } else {
            e.target.style.borderColor = '#d1d5db';
        }
    }
});

// Add phone number formatting
document.addEventListener('input', (e) => {
    if (e.target.type === 'tel') {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 6) {
            value = value.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
        } else if (value.length >= 3) {
            value = value.replace(/(\d{3})(\d{0,3})/, '$1-$2');
        }
        e.target.value = value;
    }
}); 