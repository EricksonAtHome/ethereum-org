import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/ride_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/passiart_map.dart';
import '../widgets/passiar_widgets.dart';
import 'ride_selection_screen.dart';

class DestinationScreen extends StatefulWidget {
  const DestinationScreen({super.key});

  @override
  State<DestinationScreen> createState() => _DestinationScreenState();
}

class _DestinationScreenState extends State<DestinationScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<RideProvider>().loadSuggestions();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<RideProvider>();

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: const PassiarAppBar(title: 'Destination'),
      body: Stack(
        children: [
          const PassiarMap(),
          SafeArea(
            child: Column(
              children: [
                const SizedBox(height: kToolbarHeight + 8),
                LocationInputCard(
                  pickupAddress: provider.pickup.address,
                  destinationAddress: provider.destination.address,
                ),
                const Spacer(),
                _SuggestionsPanel(
                  suggestions: provider.suggestions,
                  onSelect: (suggestion) {
                    provider.setDestination(suggestion);
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => const RideSelectionScreen(),
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const RideSelectionScreen()),
          );
        },
        backgroundColor: AppColors.primaryYellow,
        foregroundColor: AppColors.textPrimary,
        icon: const Icon(Icons.arrow_forward),
        label: const Text('Continue', style: TextStyle(fontWeight: FontWeight.w700)),
      ),
    );
  }
}

class _SuggestionsPanel extends StatelessWidget {
  final List suggestions;
  final void Function(dynamic suggestion) onSelect;

  const _SuggestionsPanel({
    required this.suggestions,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 20,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              const Text('🔥', style: TextStyle(fontSize: 16)),
              const SizedBox(width: 6),
              Text(
                'SUGGESTIONS FOR YOU',
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 12,
                  color: AppColors.textSecondary,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (suggestions.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 8),
              child: Text('Loading suggestions...'),
            )
          else
            ...suggestions.map((s) => _SuggestionTile(
                  name: s.name,
                  address: s.address,
                  onTap: () => onSelect(s),
                )),
        ],
      ),
    );
  }
}

class _SuggestionTile extends StatelessWidget {
  final String name;
  final String address;
  final VoidCallback onTap;

  const _SuggestionTile({
    required this.name,
    required this.address,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.primaryYellow.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                Icons.location_on,
                color: AppColors.primaryYellow,
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                  Text(
                    address,
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: AppColors.textSecondary),
          ],
        ),
      ),
    );
  }
}
