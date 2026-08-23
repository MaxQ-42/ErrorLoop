import type { Board, Paper, Question, ThemePreference } from '../../types'
export interface LocalStore { boards:Board[]; questions:Question[]; papers:Paper[]; settings:{theme:ThemePreference} }
const KEY='errorloop.v01.data'; const blank=():LocalStore=>({boards:[],questions:[],papers:[],settings:{theme:'dark'}})
export const localAdapter={read():LocalStore{try{const raw=JSON.parse(localStorage.getItem(KEY)||'null');return {...blank(),...raw,settings:{theme:'dark',...(raw?.settings||{})}}}catch{return blank()}},write(store:LocalStore){localStorage.setItem(KEY,JSON.stringify(store))}}
