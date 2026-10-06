import JSZip from 'jszip';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { MindNode, MindMapRecord } from '../../types/mindmap';
import { db } from '../db';

export async function importMindGenius(file: File): Promise<MindNode> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(file);
  const docFile = loadedZip.file('Document.xml');
  
  if (!docFile) {
    throw new Error('Invalid .mgmx file: Document.xml not found');
  }
  
  // Read using utf-8 explicitly to preserve diacritics
  const xmlContent = new TextDecoder('utf-8').decode(await docFile.async('uint8array'));
  
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    trimValues: true,
  });
  
  const parsed = parser.parse(xmlContent);
  const rootBranch = parsed?.MindGeniusDocument?.Map?.RootBranch;
  
  if (!rootBranch) {
    throw new Error('Invalid .mgmx format: Missing Map > RootBranch');
  }

  function parseBranch(branchXml: any): MindNode {
    const topic = branchXml['@_Title'] || branchXml['Title'] || 'Untitled';
    const description = branchXml['Notes'] || branchXml['Description'] || '';
    
    let task: MindNode['task'] = undefined;
    const taskInfo = branchXml['TaskInformation'];
    if (taskInfo) {
      task = {};
      if (taskInfo['@_StartDate']) task.startDate = taskInfo['@_StartDate'];
      if (taskInfo['@_DueDate']) task.endDate = taskInfo['@_DueDate'];
      if (taskInfo['@_Duration']) task.duration = Number(taskInfo['@_Duration']);
      if (taskInfo['@_PercentComplete']) task.progress = Number(taskInfo['@_PercentComplete']);
      if (taskInfo['@_Resource']) task.assignee = taskInfo['@_Resource'];
    }

    const node: MindNode = {
      id: crypto.randomUUID(),
      topic,
      description,
      task,
    };
    
    // Style color handling
    if (branchXml['Style'] && branchXml['Style']['@_FillColor']) {
      node.color = branchXml['Style']['@_FillColor'];
    }

    // Children parsing
    if (branchXml.Branches && branchXml.Branches.Branch) {
      const childrenArr = Array.isArray(branchXml.Branches.Branch) 
        ? branchXml.Branches.Branch 
        : [branchXml.Branches.Branch];
      node.children = childrenArr.map(parseBranch);
    } else {
      node.children = [];
    }
    
    return node;
  }
  
  const rootNode = parseBranch(rootBranch);
  
  // Persistence
  const mapRecord: MindMapRecord = {
    id: crypto.randomUUID(),
    title: rootNode.topic,
    updatedAt: Date.now(),
    syncStatus: 'pending',
    userId: 'local',
    rootData: rootNode
  };
  
  await db.mindmaps.put(mapRecord);
  return rootNode;
}

export async function exportMindGenius(rootNode: MindNode, title: string) {
  function serializeNode(node: MindNode): any {
    const branch: any = {
      '@_Title': node.topic,
    };
    
    if (node.description) {
      branch['Notes'] = node.description;
    }
    
    if (node.task) {
      branch['TaskInformation'] = {};
      if (node.task.startDate) branch['TaskInformation']['@_StartDate'] = node.task.startDate;
      if (node.task.endDate) branch['TaskInformation']['@_DueDate'] = node.task.endDate;
      if (node.task.duration) branch['TaskInformation']['@_Duration'] = node.task.duration;
      if (node.task.progress !== undefined) branch['TaskInformation']['@_PercentComplete'] = node.task.progress;
      if (node.task.assignee) branch['TaskInformation']['@_Resource'] = node.task.assignee;
    }
    
    if (node.color) {
      branch['Style'] = { '@_FillColor': node.color };
    }
    
    if (node.children && node.children.length > 0) {
      branch['Branches'] = {
        Branch: node.children.map(serializeNode)
      };
    }
    
    return branch;
  }

  const xmlStructure = {
    '?xml': { '@_version': '1.0', '@_encoding': 'utf-8' },
    MindGeniusDocument: {
      '@_Version': '10.0',
      DocumentProperties: {
        Title: title,
        Author: 'Smart Note Mindmap PWA'
      },
      Map: {
        RootBranch: serializeNode(rootNode)
      }
    }
  };

  const builder = new XMLBuilder({
    ignoreAttributes: false,
    format: true,
  });
  
  const xmlContent = builder.build(xmlStructure);
  
  const zip = new JSZip();
  zip.file('Document.xml', new TextEncoder().encode(xmlContent));
  
  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/zip', compression: 'DEFLATE' });
  
  if (navigator.share && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
    const file = new File([blob], `${title}.mgmx`, { type: 'application/zip' });
    await navigator.share({ files: [file], title: title });
  } else {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.mgmx`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
