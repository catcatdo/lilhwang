// 20mm PVC split-clamp manifold (TOP with 8 ports + BOTTOM clamp)
// for 4/7 tube (ID 4mm, OD 7mm)
// OpenSCAD: set part_mode = "top" | "bottom" | "both"

$fn = 120;
part_mode = "both";

// ===== Pipe =====
pipe_od = 20.0;
pipe_r = pipe_od/2;

// ===== Port layout =====
port_count = 8;
port_pitch = 16.0;
span = (port_count-1)*port_pitch;
body_len = span + 26;

// ===== Clamp body =====
body_w = 16;          // Y width
top_h = 16;           // Z height of top part
bot_h = 10;           // Z height of bottom part
seat_clear = 0.20;    // clearance around pipe for easy assembly

// ===== Port geometry =====
stem_d = 5.8;         // through-hole diameter on top body
stem_insert = 3.0;    // stem sinks toward pipe
port_sink = 2.6;      // visual sink amount

flow_d = 3.2;
tube_od = 7.0;
barb_len = 11.0;
barb_base_d = tube_od + 0.3;
barb_tip_d  = tube_od - 0.4;
barb_rings = 2;
ring_h = 0.8;
ring_step = 3.0;

// ===== Bolts (M3) =====
bolt_d = 3.4;         // clearance
head_d = 6.4;         // M3 socket head approx
head_h = 3.0;
bolt_x_margin = 10;
bolt_y = body_w/2 - 3.6;

// ===== Alignment pins =====
pin_d = 3.0;
pin_h = 2.0;
pin_fit = 0.20;       // socket extra clearance

module hose_barb() {
  union() {
    cylinder(h=barb_len, d1=barb_base_d, d2=barb_tip_d);
    for (i=[0:barb_rings-1])
      translate([0,0,2.0 + i*ring_step])
        cylinder(h=ring_h, d1=barb_base_d+0.7, d2=barb_base_d+0.2);
  }
}

module top_ports() {
  for (i=[0:port_count-1]) {
    x = -span/2 + i*port_pitch;
    translate([x,0,top_h - port_sink]) {
      // shoulder + stem
      union() {
        cylinder(h=2.6, d=8.2);
        translate([0,0,-stem_insert]) cylinder(h=stem_insert, d=stem_d);
        translate([0,0,2.6]) hose_barb();
      }
    }
  }
}

module pipe_cut_top() {
  // semicircle cut on underside of top part
  translate([0,0,0])
    rotate([0,90,0])
      cylinder(h=body_len+2, r=pipe_r + seat_clear, center=true);
}

module pipe_cut_bottom() {
  // semicircle cut on upper side of bottom clamp
  translate([0,0,bot_h])
    rotate([0,90,0])
      cylinder(h=body_len+2, r=pipe_r + seat_clear, center=true);
}

module bolt_positions() {
  for (x=[-span/2 - bolt_x_margin, span/2 + bolt_x_margin]) {
    translate([x, bolt_y, 0]) children();
    translate([x,-bolt_y, 0]) children();
  }
}

module top_part() {
  difference() {
    union() {
      // top block
      translate([-body_len/2,-body_w/2,0]) cube([body_len, body_w, top_h]);
      top_ports();
      // alignment pins (downward)
      for (x=[-span/2-4, span/2+4])
        translate([x,0,0]) cylinder(h=pin_h, d=pin_d);
    }

    // pipe seat cut
    pipe_cut_top();

    // port flow holes to pipe interior
    for (i=[0:port_count-1]) {
      x = -span/2 + i*port_pitch;
      translate([x,0,top_h - port_sink - stem_insert - 0.2])
        cylinder(h=stem_insert + 2.6 + barb_len + 2, d=flow_d);
    }

    // bolt holes + head pocket on top
    bolt_positions() {
      translate([0,0,-0.2]) cylinder(h=top_h+1, d=bolt_d);
      translate([0,0,top_h-head_h]) cylinder(h=head_h+0.3, d=head_d);
    }
  }
}

module bottom_part() {
  difference() {
    // bottom block
    translate([-body_len/2,-body_w/2,0]) cube([body_len, body_w, bot_h]);

    // pipe seat cut (upper side)
    pipe_cut_bottom();

    // alignment pin sockets (top side)
    for (x=[-span/2-4, span/2+4])
      translate([x,0,bot_h-pin_h-0.1]) cylinder(h=pin_h+0.2, d=pin_d+pin_fit);

    // bolt through-holes
    bolt_positions()
      translate([0,0,-0.2]) cylinder(h=bot_h+1, d=bolt_d);
  }
}

if (part_mode == "top") {
  top_part();
} else if (part_mode == "bottom") {
  bottom_part();
} else {
  // both for preview
  translate([0,0,12]) top_part();
  bottom_part();
}

/*
조립
1) PVC 20mm 파이프에 포트 위치 8개 표시 후 상부에서 5.8mm 홀 가공.
2) top_part를 파이프 위에, bottom_part를 아래에 두고 M3 볼트 4개로 체결.
3) 누수 방지: 포트 주변에 실리콘/에폭시 실링 권장.
4) 4/7 튜브를 바브에 꽂아 사용.

출력
- 소재 PETG 권장
- top/bottom 각각 출력 (part_mode 변경)
- 레이어 0.2, walls 4+, infill 45~60%
*/
