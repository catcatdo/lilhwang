// 20mm PVC one-piece wet-seal manifold (8 ports, 4/7 tube)
// 목표: 물 누수 최소화를 위한 일체형 구조
// - 상부 8포트 + 하부 곡면 새들(접착면 넓게)
// - 볼트/분할 조립 없음
// - PVC 본드 + 실리콘으로 고정 전제

$fn = 140;

// ===== PVC =====
pipe_od = 20.0;
pipe_r = pipe_od/2;
pipe_wall = 2.2;

// ===== Port layout =====
port_count = 8;
port_pitch = 16.0;
span = (port_count-1)*port_pitch;

// ===== One-piece body =====
body_len = span + 30;     // 양 끝 여유
body_w = 18.0;            // 접착면 넓힘
base_h = 6.0;             // 본체 두께
seat_depth = 2.2;         // 파이프 곡면에 파고드는 깊이

// ===== Port geometry =====
// 하부 연결 스템(파이프 홀에 들어감)
stem_d = 5.8;
stem_insert = 3.2;

// 상부 호스 바브 (4/7)
flow_d = 3.2;
tube_od = 7.0;
barb_len = 11.0;
barb_base_d = tube_od + 0.35;
barb_tip_d  = tube_od - 0.45;
barb_rings = 2;
ring_h = 0.8;
ring_step = 3.1;

// 누수 완화용 보스(포트 둘레 볼륨)
boss_d = 9.8;
boss_h = 2.6;

module hose_barb() {
    union() {
        cylinder(h=barb_len, d1=barb_base_d, d2=barb_tip_d);
        for (i=[0:barb_rings-1])
            translate([0,0,2.0 + i*ring_step])
                cylinder(h=ring_h, d1=barb_base_d+0.75, d2=barb_base_d+0.25);
    }
}

module one_port() {
    difference() {
        union() {
            // 본체 위 보스
            cylinder(h=boss_h, d=boss_d);
            // 파이프 홀로 들어갈 스템
            translate([0,0,-stem_insert]) cylinder(h=stem_insert, d=stem_d);
            // 상부 바브
            translate([0,0,boss_h]) hose_barb();
        }
        // 유로
        translate([0,0,-stem_insert-0.2])
            cylinder(h=stem_insert+boss_h+barb_len+1, d=flow_d);
    }
}

module onepiece_body() {
    // 평평한 본체 + 하부 곡면 안장
    difference() {
        translate([-body_len/2, -body_w/2, 0])
            cube([body_len, body_w, base_h]);

        // 파이프 곡면 컷(밀착)
        translate([0,0,-pipe_r + seat_depth])
            rotate([0,90,0])
                cylinder(h=body_len+2, r=pipe_r, center=true);
    }
}

module manifold_onepiece() {
    difference() {
        union() {
            onepiece_body();

            // 8개 포트
            for (i=[0:port_count-1]) {
                x = -span/2 + i*port_pitch;
                translate([x,0,base_h-0.2])
                    one_port();
            }
        }

        // 파이프 윗벽 관통홀 유도(포트마다)
        for (i=[0:port_count-1]) {
            x = -span/2 + i*port_pitch;
            translate([x,0,base_h-0.2-stem_insert-0.1])
                cylinder(h=stem_insert+1.6, d=stem_d);
        }
    }
}

manifold_onepiece();

/*
제작/조립 가이드
1) PVC 20mm 파이프에 8개 홀(권장 5.8~6.0mm) 가공
2) 일체형 부품을 위에서 맞춰 끼움 (스템이 홀에 들어감)
3) 접착:
   - 1차: PVC 본드(또는 ABS/PETG 대응 접착제)
   - 2차: 포트 둘레 및 본체 양끝 실리콘 실링
4) 24h 경화 후 누수 테스트

출력 권장 (PETG)
- 레이어 0.2
- 벽 4~5줄, 인필 55%+
- 출력 방향: 하부 곡면이 위로 뜨지 않게, 본체 평면을 베드에
- 바브에 서포터 최소(트리/오가닉) 권장

주의
- 완전 방수는 출력 품질+접착 품질에 좌우됨
- 필요 시 stem_d를 +0.1/-0.1 튜닝
*/
