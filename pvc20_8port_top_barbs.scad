// 20mm PVC pipe top-mount 8-port barb strip (for 4/7 tube)
// 목적: 20mm PVC 파이프 '윗면'에 호스 꽂는 바브만 8개 돌출되게 제작
// 출력: OpenSCAD -> STL

$fn = 96;

// ===== 파라미터 =====
pipe_od = 20.0;          // PVC 외경
pipe_radius = pipe_od/2;

port_count = 8;          // 돌출 포트 개수
port_pitch = 16.0;       // 포트 간격(mm)

// 베이스(파이프 위에 붙는 새들)
base_len = (port_count-1)*port_pitch + 18; // 여유 포함
base_width = 10.0;       // 파이프 축 직각 방향 폭
base_thick = 3.0;
saddle_depth = 1.4;      // 파이프 곡면 따라 파이는 깊이

// 파이프에 뚫을 권장 구멍(포트당)
hole_d_recommended = 5.8;  // 5.6~6.0 권장 (프린터 공차 따라 조정)

// 포트 하부 스템(파이프 구멍에 들어가는 부분)
stem_d = 5.6;
stem_l = 3.0;

// 상부 바브 (4/7 튜브용)
tube_id = 4.0;
tube_od = 7.0;
barb_l = 11.0;
barb_base_d = tube_od + 0.3; // 7.3
barb_tip_d  = tube_od - 0.4; // 6.6
barb_rings = 2;
ring_h = 0.8;
ring_step = 3.0;

// 내부 유로
flow_d = 3.2; // 너무 얇으면 막힘, 너무 크면 강도 저하

// ===== 모듈 =====
module hose_barb() {
  union() {
    cylinder(h=barb_l, d1=barb_base_d, d2=barb_tip_d);
    for (i=[0:barb_rings-1]) {
      translate([0,0,2.0 + i*ring_step])
        cylinder(h=ring_h, d1=barb_base_d+0.7, d2=barb_base_d+0.2);
    }
  }
}

module one_port() {
  difference() {
    union() {
      // 파이프 구멍 안으로 들어가는 스템
      translate([0,0,-stem_l]) cylinder(h=stem_l, d=stem_d);
      // 베이스 위 바디
      cylinder(h=base_thick, d=8.2);
      // 호스 바브
      translate([0,0,base_thick]) hose_barb();
    }
    // 유로
    translate([0,0,-stem_l-0.2]) cylinder(h=stem_l+base_thick+barb_l+1, d=flow_d);
  }
}

module saddle_base() {
  // 평판 + 하부 곡면 컷으로 파이프 위에 얹히는 형태
  difference() {
    translate([-base_len/2, -base_width/2, 0])
      cube([base_len, base_width, base_thick]);

    // 파이프 곡면을 살짝 파서 접촉면 확보
    translate([0,0,-pipe_radius + saddle_depth])
      rotate([0,90,0])
        cylinder(h=base_len+2, r=pipe_radius, center=true);
  }
}

module manifold_8ports() {
  union() {
    saddle_base();

    for (i=[0:port_count-1]) {
      x = -((port_count-1)*port_pitch)/2 + i*port_pitch;
      translate([x,0,base_thick]) one_port();
    }
  }
}

manifold_8ports();

/*
조립 가이드
1) 20mm PVC 파이프 윗면에 포트 8개 위치 표시 (간격 port_pitch)
2) 각 위치에 hole_d_recommended(기본 5.8mm)로 관통 구멍 가공
3) 출력물 하부(stem)를 구멍에 맞춰 끼움
4) PVC 본드/에폭시/실리콘으로 접합 및 누수 실링
5) 4/7 튜브를 바브에 꽂음

프린팅 권장
- 소재: PETG/ABS (수분/열에 PLA보다 안정)
- 레이어 0.16~0.2
- 벽 4줄 이상, 인필 50%+
- 출력 방향: 베이스 바닥을 베드에 닿게

튜닝 팁
- 헐거우면 stem_d +0.1
- 너무 빡빡하면 stem_d -0.1 또는 구멍 +0.1
*/
