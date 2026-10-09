# AI reconnaissance and economic priorities — 0.24.2

## Information rules
AI scouts choose candidate destinations from the boundary of their own explored map. The scoring uses unexplored coverage, travel distance and reservations by other scouts, never opponent spawn coordinates. Navigation still uses the shared collision/pathfinding layer so scouts avoid impassable terrain.

Each kingdom stores copies of enemy building observations. A building disappearing or changing while hidden does not silently update that report. Returning vision corrects the record. Units can defend against visible enemies without waiting for an economic threshold; distant offensive raids require settlement intelligence. Allied shared sight follows the existing diplomacy rules.

## Economic priorities
On Normal difficulty the AI needs at least 14 workers and a completed Mill, Lumber Camp and Mining Camp before offensive expansion. Recruitment keeps 135 food and 150 wood available outside emergencies. Before readiness/discovery it fields at most three newly recruited guards; scenario starting troops are retained. Raids also require two workers assigned to food, two to wood, minimum stock of 120 food/100 wood, the existing peace timer, and a full wave. Dispatches are separated by at least 90 seconds.

## Recon behavior
Existing explorers leave town first. Recruiting scouts follows worker recruitment and food reserve checks. Foot/mounted scouts have 24 sight, do not auto-acquire combat targets under AI control, avoid observed danger on planned routes, and retreat when threatened or below 55% health. Up to two healthy scouts are maintained, with at most four living scouts including recuperating units. Old building reports can trigger scouting revisits.

## Save compatibility
Recon records are optional fields on version-3 saves. Pre-recon saves initialize empty intelligence and clear AI attack orders that may have been based on hidden positions. Player orders are preserved. Loading an old game cannot reconstruct observations from unexplored ground.

## Verification scope
Compilation is checked separately. No new gameplay test or balance benchmark is claimed for this change. Full matches across map types and difficulties remain a playtest requirement.
