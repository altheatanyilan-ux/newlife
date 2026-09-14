/* ============================================================
   THE FIRST THING THAT HAPPENS

   The notice in the HTML says "The house did not start." It exists for one
   failure only — the script failing to PARSE — because that is the failure
   where nothing else in this file gets a vote: no handler fires, no recovery
   runs, and the only thing left on the page is HTML that was already there.

   If this line runs, the script parsed, and the notice is wrong. So it is
   taken down here, in the first statement of the first file in the bundle,
   rather than a couple of hundred lines into the core where it used to live.

   The notice hides itself for five seconds before it will speak, so that
   opening the house never flashes a false alarm, and that wait has to cover
   everything between "the script parsed" and "something took the notice
   down". Doing it first makes that stretch as short as it can be.

   Honesty about what this bought: nothing measurable. On a machine slowed
   sixteen times, a broken file reports its parse error at about 3.4 seconds
   and a healthy one takes the notice down at about 4.4, and moving this line
   from the middle of the core to the front of the bundle did not close that
   second. It is not setup code — it is V8 compiling four and a half megabytes
   after it has finished parsing them, and no arrangement of the source avoids
   that. The line belongs here on the argument alone: the moment the script is
   known to have parsed is the moment the notice is known to be wrong.
   ============================================================ */
try { const d = document.getElementById('deadStart'); if(d) d.remove(); } catch(e){}
