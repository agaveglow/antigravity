import jsPDF from 'jspdf';
// Forces refresh
import autoTable from 'jspdf-autotable';
import type { Student } from '../types/student';

interface ExportData {
    student: Student;
    overallProgress: number;
    courseProgress: Record<string, number>;
    projectProgress: Record<string, number>;
    courses: any[];
    projects: any[];
}

export const exportStudentProgressPDF = async ({
    student,
    overallProgress,
    courseProgress,
    projectProgress,
    courses,
    projects
}: ExportData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // --- Header ---
    doc.setFillColor(41, 128, 185); // Brand Blue
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(student.name, 20, 20);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Cohort: ${student.cohort} | ID: ${student.id}`, 20, 30);

    // Date
    doc.setFontSize(10);
    doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, pageWidth - 20, 20, { align: 'right' });

    // --- Summary Section ---
    let yPos = 50;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Performance Summary', 20, yPos);

    yPos += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');

    // Stats Grid
    const stats = [
        ['Overall Progress', `${overallProgress}%`],
        ['Predicted Grade', student.predicted_grade || 'Not Set'],
        ['XP Earned', `${student.xp || 0}`],
        ['Distinctions', `${student.grades?.filter((g: any) => g.grade === 'Distinction').length || 0}`]
    ];

    autoTable(doc, {
        startY: yPos,
        head: [['Metric', 'Value']],
        body: stats,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
        margin: { left: 20, right: pageWidth / 2 + 10 } // Left half page
    });

    // --- Courses Breakdown ---
    yPos = (doc as any).lastAutoTable.finalY + 20;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Course Progress', 20, yPos);

    yPos += 5;

    const courseData = courses.map(c => [
        c.title,
        `${courseProgress[c.id] || 0}%`,
        c.subject || 'N/A'
    ]);

    autoTable(doc, {
        startY: yPos,
        head: [['Course', 'Progress', 'Subject']],
        body: courseData,
        theme: 'grid',
        headStyles: { fillColor: [52, 152, 219] },
    });

    // --- Projects Breakdown ---
    yPos = (doc as any).lastAutoTable.finalY + 20;

    // Check if new page needed
    if (yPos > doc.internal.pageSize.height - 40) {
        doc.addPage();
        yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Project Progress', 20, yPos);
    yPos += 5;

    const projectData = projects.map(p => [
        p.title,
        `${projectProgress[p.id] || 0}%`,
        p.unit || 'N/A'
    ]);

    autoTable(doc, {
        startY: yPos,
        head: [['Project', 'Progress', 'Unit']],
        body: projectData,
        theme: 'grid',
        headStyles: { fillColor: [155, 89, 182] }, // Purple
    });

    // Save
    doc.save(`${student.name.replace(/\s+/g, '_')}_Progress_Report.pdf`);
};
