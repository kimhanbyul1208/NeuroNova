import 'package:flutter/material.dart';

// 메뉴 카테고리 아이콘&타이틀 넣는 곳
class MenuCategory {
  final IconData icon;
  final String title;
  final String url;

  const MenuCategory({
    required this.icon,
    required this.title,
    required this.url
  });
}

// 메뉴 정의
const List<MenuCategory> patientMenu = [
  MenuCategory(icon: Icons.home, title: "홈", url: "/patientMain"),
  MenuCategory(icon: Icons.calendar_today, title: "예약", url: "/appointments"),
  MenuCategory(icon: Icons.notifications, title: "알림", url: "/notifications"),
  MenuCategory(icon: Icons.person, title: "내 정보", url: "/myInfo"),
];

const List<MenuCategory> doctorMenu = [
  MenuCategory(icon: Icons.medical_services, title: "진료", url: "/doctorMain"),
  MenuCategory(icon: Icons.person, title: "내 정보", url: "/myInfo"),
];

const List<MenuCategory> adminMenu = [
  MenuCategory(icon: Icons.admin_panel_settings, title: "관리", url: "/adminMain"),
  MenuCategory(icon: Icons.verified_user, title: "회원 승인", url: "/approval"),
  MenuCategory(icon: Icons.people, title: "전체 회원관리", url: "/allUser"),
  MenuCategory(icon: Icons.person, title: "내 정보", url: "/myInfo"),
];

const List<MenuCategory> staffMenu = [
  MenuCategory(icon: Icons.assignment, title: "원무과", url: "/staffMain"),
  MenuCategory(icon: Icons.person, title: "내 정보", url: "/myInfo"),
];

// 기본 메뉴 (Fallback)
const List<MenuCategory> defaultMenu = [
  MenuCategory(icon: Icons.home, title: "홈", url: "/home"),
  MenuCategory(icon: Icons.person, title: "내 정보", url: "/myInfo"),
];
