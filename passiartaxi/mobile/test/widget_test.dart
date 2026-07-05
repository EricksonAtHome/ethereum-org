import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

import 'package:passiartaxi/main.dart';
import 'package:passiartaxi/providers/ride_provider.dart';

void main() {
  testWidgets('Passiar app loads destination screen', (WidgetTester tester) async {
    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (_) => RideProvider(),
        child: const PassiarApp(),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Destination'), findsOneWidget);
    expect(find.text('SUGGESTIONS FOR YOU'), findsOneWidget);
  });
}
