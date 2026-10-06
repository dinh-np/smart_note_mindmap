import pptxgen from 'pptxgenjs';
import * as ExcelJS from 'exceljs';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { MindNode } from '../types/mindmap';

export async function exportToPPTX(rootNode: MindNode) {
  let pres = new pptxgen();
  
  let slide = pres.addSlide();
  slide.addText(rootNode.topic, { x: 1, y: 2, w: 8, h: 2, fontSize: 36, align: 'center', bold: true, color: '0066AB' });
  slide.addText('Smart Note & Mindmap', { x: 1, y: 4, w: 8, h: 1, fontSize: 14, align: 'center', color: '666666' });

  if (rootNode.children) {
    for (const child of rootNode.children) {
      let childSlide = pres.addSlide();
      childSlide.addText(child.topic, { x: 0.5, y: 0.5, w: 9, h: 1, fontSize: 24, bold: true, color: '0066AB' });
      
      let yOffset = 2.0;
      const addBullets = (node: MindNode, depth: number) => {
        if (node.description) {
           childSlide.addText(node.description, { x: 0.5 + (depth * 0.5), y: yOffset, w: 9 - depth, h: 0.5, fontSize: 14, bullet: true });
           yOffset += 0.5;
        }
        if (node.children) {
          for (const c of node.children) {
            childSlide.addText(c.topic, { x: 0.5 + (depth * 0.5), y: yOffset, w: 9 - depth, h: 0.5, fontSize: 16, bullet: true });
            yOffset += 0.5;
            addBullets(c, depth + 1);
          }
        }
      };
      
      addBullets(child, 1);
    }
  }

  pres.writeFile({ fileName: `${rootNode.topic.replace(/[^a-z0-9]/gi, '_')}.pptx` });
}

export async function exportToXLSX(rootNode: MindNode) {
  const wb = new ExcelJS.Workbook();
  
  // Sheet 1: WBS
  const wsWbs = wb.addWorksheet('WBS');
  wsWbs.columns = [
    { header: 'ID', key: 'id', width: 36 },
    { header: 'Topic', key: 'topic', width: 40 },
    { header: 'Description', key: 'desc', width: 50 },
    { header: 'Start Date', key: 'start', width: 15 },
    { header: 'End Date', key: 'end', width: 15 },
    { header: 'Assignee', key: 'assignee', width: 20 },
    { header: 'Status', key: 'status', width: 15 },
  ];

  const traverse = (node: MindNode) => {
    wsWbs.addRow({
      id: node.id,
      topic: node.topic,
      desc: node.description || '',
      start: node.task?.startDate || '',
      end: node.task?.endDate || '',
      assignee: node.task?.assignee || '',
      status: node.status || ''
    });
    if (node.children) node.children.forEach(traverse);
  };
  traverse(rootNode);

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const fileName = `${rootNode.topic.replace(/[^a-z0-9]/gi, '_')}.xlsx`;
  a.download = fileName;
  
  if (navigator.share && /iPad|iPhone|iPod|Android/.test(navigator.userAgent)) {
    const file = new File([blob], fileName, { type: blob.type });
    navigator.share({ files: [file] }).catch(() => a.click());
  } else {
    a.click();
  }
  
  window.URL.revokeObjectURL(url);
}

export async function exportToDOCX(rootNode: MindNode) {
  const paragraphs: Paragraph[] = [
    new Paragraph({
      text: rootNode.topic,
      heading: HeadingLevel.TITLE,
    })
  ];

  const traverse = (node: MindNode, depth: number) => {
    const headingLevel = depth === 1 ? HeadingLevel.HEADING_1 : 
                         depth === 2 ? HeadingLevel.HEADING_2 : 
                         depth === 3 ? HeadingLevel.HEADING_3 : HeadingLevel.HEADING_4;

    paragraphs.push(new Paragraph({
      text: node.topic,
      heading: headingLevel,
    }));

    if (node.description) {
      paragraphs.push(new Paragraph({
        children: [new TextRun(node.description)]
      }));
    }

    if (node.children) {
      node.children.forEach(c => traverse(c, depth + 1));
    }
  };

  if (rootNode.children) {
    rootNode.children.forEach(c => traverse(c, 1));
  }

  const doc = new Document({
    sections: [{
      properties: {},
      children: paragraphs,
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const fileName = `${rootNode.topic.replace(/[^a-z0-9]/gi, '_')}.docx`;
  a.download = fileName;

  if (navigator.share && /iPad|iPhone|iPod|Android/.test(navigator.userAgent)) {
    const file = new File([blob], fileName, { type: blob.type });
    navigator.share({ files: [file] }).catch(() => a.click());
  } else {
    a.click();
  }
  
  window.URL.revokeObjectURL(url);
}

export async function exportToImage(elementId: string, filename: string) {
  const node = document.getElementById(elementId);
  if (!node) return;
  
  const dataUrl = await toPng(node, { quality: 1.0, pixelRatio: 2 });
  const a = document.createElement('a');
  a.href = dataUrl;
  const fileName = `${filename}.png`;
  a.download = fileName;

  if (navigator.share && /iPad|iPhone|iPod|Android/.test(navigator.userAgent)) {
    fetch(dataUrl).then(res => res.blob()).then(blob => {
      const file = new File([blob], fileName, { type: 'image/png' });
      navigator.share({ files: [file] }).catch(() => a.click());
    });
  } else {
    a.click();
  }
}

export async function exportToPDF(elementId: string, filename: string) {
  const node = document.getElementById(elementId);
  if (!node) return;
  
  const dataUrl = await toPng(node, { quality: 1.0, pixelRatio: 2 });
  const pdf = new jsPDF('landscape', 'pt', 'a4');
  const imgProps = pdf.getImageProperties(dataUrl);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
  
  pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
  pdf.save(`${filename}.pdf`);
}
