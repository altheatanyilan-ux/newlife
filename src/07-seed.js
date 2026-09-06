/* ============================================================
   SEED — an empty house, ready to be furnished
   Nothing here is anyone's life but yours. Every list starts
   empty; only the scaffolding the rooms need is present.
   ============================================================ */
function seed(){
  const T = today();
  return {
    version:1,
    settings:{theme:'dark',sound:false,feltTime:false,home:'home',chapterNamed:false,ribbons:true,firstOpen:T},
    reminders:[], tasks:[],
    stages:[], threads:[], tensions:[],
    values:[], valueOrder:[], valueOrderHistory:[], valueSnapshots:[],
    visionEras:[
      {id:'past',   name:'Before',  subtitle:'', startYear:'', endYear:'', color:'#d4a44c', order:0, type:'past'},
      {id:'now',    name:'Now',     subtitle:'', startYear:'', endYear:'', color:'#7f916a', order:1, type:'present'},
      {id:'ahead',  name:'Ahead',   subtitle:'', startYear:'', endYear:'', color:'#6b7f8e', order:2, type:'future'},
    ],
    visions:[], skills:[], projects:[], nods:[], ideas:[],
    habits:[], habitLog:{}, negLast:{}, checkins:{}, entries:[],
    journals:[
      {type:'reflection',name:'Reflections'},
      {type:'gratitude',name:'Gratitude'},
      {type:'dream',name:'Dreams'},
      {type:'question',name:'Open Questions'},
      {type:'synchronicity',name:'Synchronicity'},
      {type:'manifestation',name:'Manifestation'},
      {type:'quote',name:'Quotes & Marginalia'},
      {type:'memory',name:'Memories'},
      {type:'media',name:'Media'},
      {type:'lifeevent',name:'Life events'},
      {type:'letter',name:'Letters'},
      {type:'decision',name:'Decisions'},
      {type:'progress',name:'Practice log'},
      {type:'uncategorized',name:'Uncategorized'},
    ],
    rehearsal:{script:'', winning:'', aim:'', cycleStart:'', days:[]},
    reviews:{lastWeekly:null,lastSeasonal:null,lastAnnual:null},
    people:[], places:[], boards:[],
  };
}
