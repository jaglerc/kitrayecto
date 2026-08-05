export type ConsultationCategory = "trips" | "fuel" | "maintenance" | "accidents" | "inspections" | "incidents";
export interface ConsultationItem { id: number; category: ConsultationCategory; occurredAt: string; title: string; subtitle: string; status: string; vehicleType: string; plate: string; }
export interface ConsultationDetail extends ConsultationItem { fields: Array<{ label: string; value: string }>; evidences: Array<{ fileName: string; url: string }>; }
const API_URL=(import.meta.env.VITE_API_URL??"http://localhost:3000").replace(/\/+$/,"/").replace(/\/$/,"");
const headers=():Record<string,string>=>{const token=localStorage.getItem("token");return token?{Authorization:`Bearer ${token}`}:{}};
const errorMessage=async(response:Response,fallback:string)=>{try{return((await response.json())as{message?:string}).message??fallback;}catch{return fallback;}};
export const consultationService={
    async findAll(category:ConsultationCategory):Promise<ConsultationItem[]>{const response=await fetch(`${API_URL}/consultations/${category}`,{headers:headers()});if(!response.ok)throw new Error(await errorMessage(response,"No fue posible consultar los registros"));return response.json();},
    async findById(category:ConsultationCategory,id:number):Promise<ConsultationDetail>{const response=await fetch(`${API_URL}/consultations/${category}/${id}`,{headers:headers()});if(!response.ok)throw new Error(await errorMessage(response,"No fue posible consultar el detalle"));return response.json();},
};
