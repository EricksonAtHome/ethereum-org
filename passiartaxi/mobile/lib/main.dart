import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import 'providers/ride_provider.dart';
import 'screens/destination_screen.dart';
import 'theme/app_theme.dart';

void main() {
  runApp(
    ChangeNotifierProvider(
      create: (_) => RideProvider(),
      child: const PassiarApp(),
    ),
  );
}

class PassiarApp extends StatelessWidget {
  const PassiarApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Passiar',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme.copyWith(
        textTheme: GoogleFonts.interTextTheme(AppTheme.lightTheme.textTheme),
      ),
      home: const DestinationScreen(),
    );
  }
}
