// 20mm round PVC pipe segment + 8 top ports (4/7 tube)
// OpenSCAD model
$fn = 120;

// ==== Pipe ====
pipe_od = 20.0;
pipe_wall = 2.2;
pipe_id = pipe_od - 2*pipe_wall;
pipe_len = 170; // visible segment length (+20mm)

// ==== Ports ====
port_count = 8;
port_pitch = 16.0;
port_start_offset = -((port_count-1)*port_pitch)/2;

stem_d = 5.8;         // stem outside diameter
stem_h = 3.0;         // height above pipe skin before barb
stem_insert = 3.0;    // how much stem goes downward into pipe wall
seat_d = 9.2;         // curved sealing seat diameter
seat_h = 1.6;         // seat height above pipe skin
port_sink = 2.6;      // sink ports into pipe surface (~1/3 visual embed)

tube_id = 4.0;
tube_od = 7.0;    // 4/7 tube
barb_len = 11.0;
barb_base_d = tube_od + 0.3;
barb_tip_d  = tube_od - 0.4;
barb_rings = 2;
ring_h = 0.8;
ring_step = 3.0;
flow_d = 3.2;

module hose_barb() {
    union() {
        cylinder(h=barb_len, d1=barb_base_d, d2=barb_tip_d);
        for (i=[0:barb_rings-1]) {
            translate([0,0,2.0 + i*ring_step])
                cylinder(h=ring_h, d1=barb_base_d+0.7, d2=barb_base_d+0.2);
        }
    }
}

module one_port() {
    difference() {
        union() {
            // curved seat: conforms to 20mm pipe outer surface (no floating gap)
            difference() {
                cylinder(h=seat_h, d=seat_d);
                translate([0,0,-pipe_od/2])
                    rotate([0,90,0]) cylinder(h=seat_d*2, r=pipe_od/2, center=true);
            }

            // shoulder on top of seat
            translate([0,0,seat_h]) cylinder(h=stem_h, d=8.2);

            // stem that goes down into drilled hole
            translate([0,0,-stem_insert]) cylinder(h=stem_insert, d=stem_d);

            // hose barb above
            translate([0,0,seat_h+stem_h]) hose_barb();
        }
        // fluid path through port
        translate([0,0,-stem_insert-0.2])
            cylinder(h=stem_insert+seat_h+stem_h+barb_len+1, d=flow_d);
    }
}

module pvc_pipe_segment() {
    difference() {
        // Outer pipe
        rotate([0,90,0]) cylinder(h=pipe_len, d=pipe_od, center=true);
        // Inner hollow
        rotate([0,90,0]) cylinder(h=pipe_len+2, d=pipe_id, center=true);
    }
}

module pipe_with_ports() {
    difference() {
        union() {
            pvc_pipe_segment();
            // place 8 ports on top tangent of pipe
            for (i=[0:port_count-1]) {
                x = port_start_offset + i*port_pitch;
                translate([x, 0, pipe_od/2 - port_sink])
                    one_port();
            }
        }

        // drill down through top wall so pipe water connects to each port
        for (i=[0:port_count-1]) {
            x = port_start_offset + i*port_pitch;
            translate([x,0,pipe_od/2 - pipe_wall/2])
                cylinder(h=pipe_wall+1.2, d=stem_d, center=true);
        }
    }
}

pipe_with_ports();

/*
메모
- 이 모델은 '원형 파이프 + 상단 8포트 돌출' 형태를 한 번에 보여주기 위한 본체형입니다.
- 실제 제작 시에는 누수 방지를 위해 포트 주변 실링(에폭시/실리콘) 권장.
- 출력 난이도가 높으면: 파이프와 포트 스트립을 분리 출력 후 접착 방식 사용.
*/
