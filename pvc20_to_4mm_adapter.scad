// PVC 20mm manifold -> 4mm (ID) tube bulkhead adapter
// Parametric OpenSCAD model
// Usage: set values, render (F6), export STL

$fn = 96;

// ==== Core dimensions ====
pvc_od = 20.0;           // PVC outer diameter (mm) - user target
wall_thickness = 2.2;    // PVC wall thickness estimate (mm)
pvc_id = pvc_od - 2*wall_thickness;

// Drill hole on PVC wall for this adapter
panel_hole_d = 8.2;      // Recommended drill size for shank clearance

// 4mm ID tube assumptions (typical 4/6 or 4/7 tubing)
tube_id = 4.0;
tube_od = 7.0;            // 4/7 tube (ID 4mm / OD 7mm)

// ==== Adapter geometry ====
flange_d = 13.5;          // outside flange sitting on PVC outer wall
flange_t = 2.2;

shank_d = 8.0;            // goes through PVC hole
shank_l = 6.0;            // enough for wall + inner nut

barb_base_d = tube_od + 0.3;  // press fit start
barb_tip_d  = tube_od - 0.4;  // lead-in
barb_l = 11.0;
barb_rings = 2;           // 2~3 recommended
ring_h = 0.8;
ring_step = 3.0;

// Nut (inside)
nut_hex_d = 13.0;
nut_t = 4.0;

thread_clearance = 0.25;  // crude tolerance helper for FDM

// ---- Modules ----
module hose_barb() {
    union() {
        // main cone
        cylinder(h=barb_l, d1=barb_base_d, d2=barb_tip_d);
        // retention rings
        for (i=[0:barb_rings-1]) {
            translate([0,0,2.2 + i*ring_step])
                cylinder(h=ring_h, d1=barb_base_d+0.7, d2=barb_base_d+0.2);
        }
    }
}

module adapter_body() {
    difference() {
        union() {
            // flange outside
            cylinder(h=flange_t, d=flange_d);
            // shank through wall
            translate([0,0,flange_t]) cylinder(h=shank_l, d=shank_d);
            // barb outwards
            translate([0,0,flange_t+shank_l]) hose_barb();
        }
        // fluid path
        translate([0,0,-0.2])
            cylinder(h=flange_t+shank_l+barb_l+1, d=tube_id);
    }
}

module lock_nut() {
    difference() {
        // hex nut
        cylinder(h=nut_t, d=nut_hex_d, $fn=6);
        // center hole (slip over shank)
        translate([0,0,-0.2]) cylinder(h=nut_t+0.4, d=shank_d+thread_clearance);
    }
}

// ---- Layout for export ----
// Part A: adapter
translate([0,0,0]) adapter_body();

// Part B: lock nut (separate print)
translate([20,0,0]) lock_nut();

/*
Assembly notes:
1) Drill PVC wall with panel_hole_d (start 8.0~8.2mm).
2) Insert adapter from outside (flange side outside).
3) Inside PVC, add small silicone washer (optional) + printed lock_nut.
4) Hand tighten, then quarter-turn only.
5) Push 4mm ID tube onto barb with warm water assist if tight.

Print notes (PETG recommended):
- Layer: 0.16~0.2
- Walls: 4+
- Infill: 40~60%
- Orientation: print adapter standing on flange, nut flat on bed
*/
