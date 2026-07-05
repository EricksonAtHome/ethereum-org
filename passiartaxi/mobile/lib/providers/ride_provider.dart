import 'package:flutter/foundation.dart';

import '../models/ride_models.dart';
import '../services/api_service.dart';

class RideProvider extends ChangeNotifier {
  final PassiarApi _api = PassiarApi();

  LocationModel pickup = const LocationModel(
    lat: 21.0285,
    lng: 105.8542,
    address: 'Taiky str, Ha Noi, Viet Nam',
  );

  LocationModel destination = const LocationModel(
    lat: 21.0245,
    lng: 105.8412,
    address: '13 woodburn',
  );

  List<SuggestionModel> suggestions = [];
  List<RideOptionModel> rideOptions = [];
  String selectedRideType = 'economy';
  String selectedPayment = 'cash';
  PricingModel? pricing;
  RideModel? activeRide;
  TripTrackModel? tracking;
  bool isLoading = false;
  String? error;

  Future<void> loadSuggestions() async {
    try {
      suggestions = await _api.getSuggestions();
      notifyListeners();
    } catch (_) {
      suggestions = const [
        SuggestionModel(
          id: 'sug-1',
          name: '43 Hang Bai',
          address: '43 Hang Bai, Hoan Kiem, Ha Noi, Viet Nam',
          lat: 21.0267,
          lng: 105.8521,
        ),
      ];
      notifyListeners();
    }
  }

  Future<void> loadRideOptions() async {
    try {
      rideOptions = await _api.getRideOptions();
    } catch (_) {
      rideOptions = const [
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
    await refreshPricing();
    notifyListeners();
  }

  void setDestination(SuggestionModel suggestion) {
    destination = LocationModel(
      lat: suggestion.lat,
      lng: suggestion.lng,
      address: suggestion.address,
    );
    notifyListeners();
  }

  void selectRideType(String type) {
    selectedRideType = type;
    refreshPricing();
    notifyListeners();
  }

  void selectPayment(String method) {
    selectedPayment = method;
    refreshPricing();
    notifyListeners();
  }

  Future<void> refreshPricing() async {
    try {
      pricing = await _api.getPricing(
        pickup: pickup,
        destination: destination,
        rideType: selectedRideType,
        paymentMethod: selectedPayment,
      );
    } catch (_) {
      double base = 4.0;
      for (final o in rideOptions) {
        if (o.id == selectedRideType) {
          base = o.basePrice;
          break;
        }
      }
      final fee = selectedPayment == 'credit_card' ? 45.0 : 0.0;
      pricing = PricingModel(ridePrice: base, paymentFee: fee, total: base + fee);
    }
    notifyListeners();
  }

  Future<RideModel?> bookRide() async {
    isLoading = true;
    error = null;
    notifyListeners();

    try {
      activeRide = await _api.bookRide(
        pickup: pickup,
        destination: destination,
        rideType: selectedRideType,
        paymentMethod: selectedPayment,
      );
      isLoading = false;
      notifyListeners();
      return activeRide;
    } catch (e) {
      error = e.toString();
      isLoading = false;
      notifyListeners();
      return null;
    }
  }

  Future<void> refreshTracking() async {
    if (activeRide == null) return;
    tracking = await _api.getTracking(activeRide!.id);
    notifyListeners();
  }
}
