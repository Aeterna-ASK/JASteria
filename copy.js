import fs from 'fs';
import path from 'path';

const files = [
    {
        src: 'G:\\マイドライブ\\JAS用\\オーガニックレストラン\\R7年度監査用\\JAS監査必要書類一覧.xlsx',
        dest: 'c:\\Users\\user\\Desktop\\WebApp\\JASAGRI\\restaurant\\audit_required_docs.xlsx'
    },
    {
        src: 'G:\\マイドライブ\\JAS用\\オーガニックレストラン\\R7年度監査用\\有機JAS審査指摘改善事項2025.6.24.docx',
        dest: 'c:\\Users\\user\\Desktop\\WebApp\\JASAGRI\\restaurant\\audit_issues_2025.docx'
    },
    {
        src: 'G:\\マイドライブ\\JAS用\\オーガニックレストラン\\R7年度監査用\\有機JAS審査指摘改善事項2024.9.19.docx',
        dest: 'c:\\Users\\user\\Desktop\\WebApp\\JASAGRI\\restaurant\\audit_issues_2024.docx'
    },
    {
        src: 'G:\\マイドライブ\\JAS用\\オーガニックレストラン\\R7年度監査用\\料理スペック\\R7 スペックサラダ.xlsx',
        dest: 'c:\\Users\\user\\Desktop\\WebApp\\JASAGRI\\restaurant\\salad_spec.xlsx'
    },
    {
        src: 'G:\\マイドライブ\\JAS用\\オーガニックレストラン\\R7年度監査用\\料理スペック\\R7 スペックサラダ.pdf',
        dest: 'c:\\Users\\user\\Desktop\\WebApp\\JASAGRI\\restaurant\\salad_spec.pdf'
    }
];

files.forEach(file => {
    try {
        if (fs.existsSync(file.src)) {
            fs.copyFileSync(file.src, file.dest);
            console.log(`Copied successfully: ${path.basename(file.dest)}`);
        } else {
            console.log(`Source file does not exist: ${path.basename(file.src)}`);
        }
    } catch (err) {
        console.error(`Error copying ${path.basename(file.src)}:`, err.message);
    }
});
