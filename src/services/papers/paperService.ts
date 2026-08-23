import type { Paper } from '../../types';import { localAdapter } from '../../adapters/local/store'
export const paperService={getAll:()=>localAdapter.read().papers,getById:(id:string)=>localAdapter.read().papers.find(p=>p.id===id),create(p:Paper){this.update(p)},update(p:Paper){const s=localAdapter.read();s.papers=[p,...s.papers.filter(x=>x.id!==p.id)];localAdapter.write(s)}}
