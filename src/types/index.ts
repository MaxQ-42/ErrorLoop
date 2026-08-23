export type Subject = 'chinese'|'math'|'english'|'history'|'politics'|'geography'
export type ContentType = 'question'|'paper'
export type ImageMode = 'original'|'color'|'gray'
export interface CropPoint { x:number; y:number }
export interface ImageAsset { id:string; order:number; original:string; scanned:string; mode:ImageMode; name:string; cropPoints:CropPoint[]; rotation:number }
export type ThemePreference='system'|'light'|'dark'
export interface Board { id:string; name:string; icon:string; color:string; description?:string; createdAt:string; updatedAt:string }
export interface Question { id:string; type:'question'; userId:string; subject:Subject; title:string; chapter:string; knowledgePoint:string; source:string; note:string; originalImages:ImageAsset[]; scannedImages:ImageAsset[]; paperId?:string; boardIds:string[]; createdAt:string; updatedAt:string; reviewCount:number; masteryStatus:'new'|'learning'|'mastered' }
export interface Paper { id:string; type:'paper'; userId:string; name:string; subject:Subject; examType:string; date:string; source:string; description:string; originalImages:ImageAsset[]; scannedImages:ImageAsset[]; questionIds:string[]; boardIds:string[]; createdAt:string; updatedAt:string }
export const SUBJECTS: Record<Subject,{label:string; short:string; color:string}> = { chinese:{label:'语文',short:'语',color:'#dc6b53'}, math:{label:'数学',short:'数',color:'#2867d6'}, english:{label:'外语',short:'外',color:'#8b62c8'}, history:{label:'历史',short:'史',color:'#b47b42'}, politics:{label:'政治',short:'政',color:'#d45a79'}, geography:{label:'地理',short:'地',color:'#278d78'} }
export const EXAM_TYPES=['日常练习','周练','月考','期中','期末','模拟考试','联考','高考真题','专题练习','其他']
