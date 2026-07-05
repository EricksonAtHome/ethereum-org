import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/ride_models.dart';

class ApiConfig {
  static const ridesBaseUrl = String.fromEnvironment(
    'RIDES_URL',
    defaultValue: 'http://localhost:8080',
  );
  static const intelligenceBaseUrl = String.fromEnvironment(
    'INTELLIGENCE_URL',
    defaultValue: 'http://localhost:8082',
  );
  static const trackingBaseUrl = String.fromEnvironment(
    'TRACKING_URL',
    defaultValue: 'http://localhost:8081',
  );
}

class PassiarApi {
  Future<List<SuggestionModel>> getSuggestions({String query = ''}) async {
    final uri = Uri.parse(
      '${ApiConfig.intelligenceBaseUrl}/api/suggestions?q=$query',
    );
    final response = await http.get(uri);
    if (response.statusCode != 200) return [];

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    final list = data['suggestions'] as List<dynamic>;
    return list
        .map((e) => SuggestionModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<RideOptionModel>> getRideOptions() async {
    final uri = Uri.parse('${ApiConfig.ridesBaseUrl}/api/rides/options');
    final response = await http.get(uri);
    if (response.statusCode != 200) return _fallbackOptions();

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    final list = data['options'] as List<dynamic>;
    return list
        .map((e) => RideOptionModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<PricingModel> getPricing({
    required LocationModel pickup,
    required LocationModel destination,
    required String rideType,
    required String paymentMethod,
  }) async {
    final uri = Uri.parse('${ApiConfig.intelligenceBaseUrl}/api/pricing');
    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'pickup': pickup.toJson(),
        'destination': destination.toJson(),
        'rideType': rideType,
        'paymentMethod': paymentMethod,
      }),
    );

    if (response.statusCode != 200) {
      return PricingModel(ridePrice: 4.0, paymentFee: 0, total: 4.0);
    }

    return PricingModel.fromJson(
      jsonDecode(response.body) as Map<String, dynamic>,
    );
  }

  Future<RideModel> bookRide({
    required LocationModel pickup,
    required LocationModel destination,
    required String rideType,
    required String paymentMethod,
  }) async {
    final uri = Uri.parse('${ApiConfig.ridesBaseUrl}/api/rides');
    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'pickup': pickup.toJson(),
        'destination': destination.toJson(),
        'pickupAddress': pickup.address,
        'destinationAddress': destination.address,
        'rideType': rideType,
        'paymentMethod': paymentMethod,
      }),
    );

    if (response.statusCode != 201) {
      throw Exception('Failed to book ride');
    }

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return RideModel.fromJson(data['ride'] as Map<String, dynamic>);
  }

  Future<TripTrackModel?> getTracking(String rideId) async {
    final uri = Uri.parse('${ApiConfig.trackingBaseUrl}/api/tracking/$rideId');
    final response = await http.get(uri);
    if (response.statusCode != 200) return null;

    return TripTrackModel.fromJson(
      jsonDecode(response.body) as Map<String, dynamic>,
    );
  }

  List<RideOptionModel> _fallbackOptions() => const [
        RideOptionModel(
          id: 'economy',
          name: 'Economy service',
          description: 'Affordable everyday rides',
          basePrice: 4.0,
          vehicleType: 'sedan',
        ),
        RideOptionModel(
          id: 'royal',
          name: 'Royal service',
          description: 'Premium comfort experience',
          basePrice: 13.0,
          vehicleType: 'suv',
        ),
        RideOptionModel(
          id: 'taxi_4seat',
          name: 'Taxi 4-seat',
          description: 'Standard taxi service',
          basePrice: 39.0,
          vehicleType: 'taxi',
        ),
      ];
}
