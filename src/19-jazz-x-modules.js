/* ============================================================
   JAZZ STUDIO — MODULE LAYER

   Each stage is divided into two to four named modules. A module
   is a cluster of exercises that belong together: the same
   technique, the same section of the book, the same week of
   Siskind's plan. Modules give the daily-plan engine a preference
   — the current module's exercises come up more often — and give
   the roadmap a fold-point so a stage with twenty items does not
   arrive as one undifferentiated wall.

   "Current module" = the first module in the current stage whose
   listed exercises are not all mastered. The daily plan boosts
   exercises from that module; the roadmap opens that module by
   default and collapses the rest.

   exerciseIds lists the canonical exercise IDs for the module.
   Exercises that end up in a stage's subs but are not listed here
   (auto-generated theory entries, tool entries, etc.) are shown
   below the last module rather than inside one.
   ============================================================ */

const JAZZ_MODULES = {

  'P0': [
    {id:'p0-mel', name:'Single intervals',
      exerciseIds:['P0.1','P0.2','P0.3','P0.4','P0.5','P0.6']},
    {id:'p0-grp', name:'Interval groups & the matrix',
      exerciseIds:['P0.7','P0.8','P0.9','P0.10','P0.11','P0.12']}
  ],

  '1': [
    {id:'1-chd', name:'The five chord types',
      exerciseIds:['1.1','1.2','1.3','1.4','1.5']},
    {id:'1-rhy', name:'Comping rhythms',
      exerciseIds:['1.909','1.910','1.901','1.902','1.903','1.904',
                   '1.905','1.906','1.907','1.908','1.911','1.912','1.913']},
    {id:'1-imp', name:'First improvising',
      exerciseIds:['IMP-B1-01','IMP-B1-02','IMP-B1-10']}
  ],

  '2': [
    {id:'2-rp',  name:'Root position & inversions',
      exerciseIds:['2.1','2.1b','2.1c']},
    {id:'2-sh',  name:'Shells & one-handed voicings',
      exerciseIds:['2.2','2.4a','2.4b','4.1a','4.1b','4.1c','4.2']},
    {id:'2-cl',  name:'Closed two-handed voicings',
      exerciseIds:['3.1','3.2','3.3']},
    {id:'2-imp', name:'ii-V-I improvisation',
      exerciseIds:['IMP-B1-03','IMP-B1-04','IMP-B1-05','IMP-B1-06A','IMP-B1-06B']},
    {id:'2-co',  name:'Coordination',
      exerciseIds:['2.901','2.902','3.901','3.902','3.903','4.901','4.902','4.903']}
  ],

  '3': [
    {id:'3-frm', name:'Blues forms & scales',
      exerciseIds:['5.1','5.1b','5.2','5.3']},
    {id:'3-lck', name:'Blues licks',
      exerciseIds:['6.1','6.2','6.3','6.4','6.5','6.6',
                   '6.7','6.8','6.9','6.10','6.11','6.12']},
    {id:'3-imp', name:'Blues improvisation',
      exerciseIds:['IMP-B1-07','IMP-B1-11','IMP-B1-08','IMP-B1-09']},
    {id:'3-coo', name:'Blues coordination',
      exerciseIds:['5.901','5.902','5.903','5.904','5.905','5.906']}
  ],

  '4': [
    {id:'4-mod', name:'Melodic minor & modal scales',
      exerciseIds:['6A.1','6A.2','6A.3','6A.4','6A.5','6A.6','6A.7','6A.8']},
    {id:'4-alt', name:'Altered dominant',
      exerciseIds:['7.1a','7.1b','7.1c','7.2','7.3','7.4','7.5','IMP-B1-12']}
  ],

  '6': [
    {id:'6-tra', name:'Transcription & memorisation',
      exerciseIds:['7A.916','7A.917','7B.915','7D.913','7B.916','7B.917']},
    {id:'6-cmp', name:'Advanced comping',
      exerciseIds:['7A.901','7A.902','7A.903','7A.904','7A.905','7A.906',
                   '7A.907','7A.908','7A.909','7A.910','7A.911',
                   '7B.904','7B.905','7B.906','7B.907','7C.901']}
  ],

  '7': [
    {id:'7-min', name:'Minor ii-V-i',
      exerciseIds:['2.3','2.3b','2.3c','2.3d','7B.901','7B.902','7B.903']},
    {id:'7-sp',  name:'Scale patterns & guidetone lines',
      exerciseIds:['7A.912','7A.913','7B.908','7B.909','7B.910','7B.911',
                   '7A.914','7A.915','7B.913','7B.914']}
  ],

  '8': [
    {id:'8-rc',  name:'Rhythm changes',
      exerciseIds:['7C.902','7C.903','7C.904','7C.905']},
    {id:'8-mot', name:'Starts, stops & motivic development',
      exerciseIds:['7C.910','7C.911','7C.912','7C.913',
                   '7C.914','7C.915','7C.916','7C.917','7C.918']},
    {id:'8-bh',  name:'Barry Harris system',
      exerciseIds:['7C.906','7C.907','7C.908','7C.909','BH.1','BH.2','BH.3','BH.4']}
  ],

  '9': [
    {id:'9-wb',  name:'Walking bass & drop-two',
      exerciseIds:['7D.901','7D.910','7D.911',
                   '7D.902','7D.903','7D.904','7D.908','7D.909']},
    {id:'9-bal', name:'Ballad devices',
      exerciseIds:['7B.912','7D.905','7D.906','7D.907','7D.912']},
    {id:'9-sp',  name:'Solo piano patterns',
      exerciseIds:[]}
  ],

  'DT': [
    {id:'dt-sing', name:'Singing levels 1–4',
      exerciseIds:['DT.1','DT.2','DT.3','DT.4']},
    {id:'dt-ref',  name:'Models & theory',
      exerciseIds:['DT.5','DT.6']}
  ],

  '10': [
    {id:'10-mod', name:'Modal vocabulary',
      exerciseIds:['8.1','8.2','8.3a','8.3b','8.3c','8.3d','8.4','8.901',
                   '8.5','8.6','9.901','8.7a','8.7b','8.8a','8.8b']},
    {id:'10-out', name:'Outside playing & modal interchange',
      exerciseIds:['10.1','10.2','10.3','10.4','10.5','10.901','10.902','10.903']}
  ],

  '11': [
    {id:'11-mb',  name:'Reharmonisation basics',
      exerciseIds:['9.1','9.2','9.3','9.4','9.5','9.6']},
    {id:'11-reh', name:'Constant structures & modulation',
      exerciseIds:['15.1','15.2','15.3','15.4','15.5','9.901']}
  ],

  '12': [
    {id:'12-odd', name:'Odd meters',
      exerciseIds:['13.1.1','13.1.2','13.1.3','13.1.4','13.1.5','13.1.6',
                   '13.2.1','13.2.2','13.2.3',
                   '13.3.1','13.3.2','13.3.3','13.3.4','13.3.5',
                   '13.4.1','13.4.2','13.4.3','13.4.4',
                   '13.5.1','13.5.2','13.6.1','13.6.2','13.7.1','13.7.2']},
    {id:'12-mod', name:'Modern & compositional',
      exerciseIds:['12.1','12.2','12.3','12.4','12.5',
                   '12.901','12.902','12.903','12.904','12.905']}
  ]

};
