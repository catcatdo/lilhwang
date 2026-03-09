// 20mm PVC PIPE + one-piece wet-seal 8-port manifold (integrated preview/body)
$fn = 140;

// Pipe
pipe_od = 20.0;
pipe_wall = 2.2;
pipe_id = pipe_od - 2*pipe_wall;
pipe_len = 170;

// Ports
port_count = 8;
port_pitch = 16.0;
span = (port_count-1)*port_pitch;

// Manifold body
body_len = span + 30;
body_w = 18.0;
base_h = 6.0;
seat_depth = 2.2;

stem_d = 5.8;
stem_insert = 3.2;
flow_d = 3.2;

tube_od = 7.0;
barb_len = 11.0;
barb_base_d = tube_od + 0.35;
barb_tip_d = tube_od - 0.45;
barb_rings = 2;
ring_h = 0.8;
ring_step = 3.1;

boss_d = 9.8;
boss_h = 2.6;

module pipe_segment(){
  difference(){
    rotate([0,90,0]) cylinder(h=pipe_len,d=pipe_od,center=true);
    rotate([0,90,0]) cylinder(h=pipe_len+2,d=pipe_id,center=true);
  }
}

module hose_barb(){
  union(){
    cylinder(h=barb_len,d1=barb_base_d,d2=barb_tip_d);
    for(i=[0:barb_rings-1])
      translate([0,0,2.0+i*ring_step])
        cylinder(h=ring_h,d1=barb_base_d+0.75,d2=barb_base_d+0.25);
  }
}

module one_port(){
  difference(){
    union(){
      cylinder(h=boss_h,d=boss_d);
      translate([0,0,-stem_insert]) cylinder(h=stem_insert,d=stem_d);
      translate([0,0,boss_h]) hose_barb();
    }
    translate([0,0,-stem_insert-0.2])
      cylinder(h=stem_insert+boss_h+barb_len+1,d=flow_d);
  }
}

module manifold_body(){
  difference(){
    translate([-body_len/2,-body_w/2,pipe_od/2]) cube([body_len,body_w,base_h]);
    translate([0,0,pipe_od/2 - pipe_od/2 + seat_depth])
      rotate([0,90,0]) cylinder(h=body_len+2,r=pipe_od/2,center=true);
  }
}

module integrated(){
  difference(){
    union(){
      pipe_segment();
      manifold_body();
      for(i=[0:port_count-1]){
        x=-span/2 + i*port_pitch;
        translate([x,0,pipe_od/2 + base_h - 0.2]) one_port();
      }
    }
    // drill each top wall connection into pipe
    for(i=[0:port_count-1]){
      x=-span/2 + i*port_pitch;
      translate([x,0,pipe_od/2 + base_h - 0.2 - stem_insert - 0.1])
        cylinder(h=stem_insert+1.8,d=stem_d);
    }
  }
}

integrated();
