const NodeGeocoder = require("node-geocoder");
const geolib = require("geolib");
const Boutique = require("../model/userBoutiqueInfoModel");
const FashionDesignerWeeklySchedule = require("../model/weeklySchleduleModel");
// let FDController = require("../controller/FDController");
const { Op } = require("sequelize");
const moment = require("moment");
const Users = require("../model/userModel");
const jwt = require("jsonwebtoken");
const Service = require("../service/userService");
const FDService = require("../service/FDService");
const BoutiqueService = require("../service/userBoutiqueService");
const BoutiqueOrder = require("../model/boutiqueOrderModel");
const { generateAccessToken, auth } = require("../jwt");
const s3 = require("../config/s3Config");
const dotenv = require("dotenv");
dotenv.config();

// Address from lat and long
var geocoder = NodeGeocoder({
  provider: "openstreetmap", // Using OpenStreetMap as the geocoding provider
});

exports.getAddress = async (req, res) => {
  try {
    var { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        HasError: true,
        StatusCode: 400,
        message: "Invalid parameter.",
      });
    }
    var method_name = await Service.getCallingMethodName();
    console.log(method_name);
    var apiEndpointInput = JSON.stringify(req.body);
    apiTrack = await Service.trackApi(
      req.query.user_id,
      method_name,
      apiEndpointInput,
      req.query.device_id,
      req.query.device_info,
      req.ip
    );
    var response = await geocoder.reverse({ lat: latitude, lon: longitude });
    var address = response[0]?.formattedAddress;

    if (address) {
      return res.status(200).json({
        HasError: false,
        StatusCode: 200,
        address,
      });
    } else {
      return res.status(404).json({
        HasError: true,
        StatusCode: 404,
        message: "Address not found for the given latitude and longitude.",
      });
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return res.status(500).json({
      HasError: true,
      StatusCode: 500,
      message: "An error occurred while processing the request.",
    });
  }
};

// Nearest boutique from lat and long, sort_type filter
exports.getNearestBoutiqueList = async (req, res) => {
  try {
    var mapCategoryType = (categoryType) => {
      if (!categoryType) {
        return "Male, Female, Kids";
      }
      var labels = [];
      var categoryTypes = categoryType.split(",");
      categoryTypes.forEach((type) => {
        if (type === "1") {
          labels.push("Male");
        } else if (type === "2") {
          labels.push("Female");
        } else if (type === "3") {
          labels.push("Kids");
        } else if (type === "4") {
          labels.push("Male, Female, Kids");
        } else {
          labels.push("Male, Female, Kids");
        }
      })
      return labels.join(",");
    }
    var latitude = req.body.latitude;
    var longitude = req.body.longitude;
    var mobile_number = req.body.mobile_number;
    var letter = req.body.search_by_letter;
    var sortType = req.body.sort_type;
    var filter_by_gender = req.body.filter_by_gender;
    var filter_by_item = req.body.filter_by_item;
    var search = req.body.search
    if (!latitude || !longitude) {
      return res.status(400).json({
        HasError: true,
        StatusCode: 400,
        message: "Invalid Credential.",
      });
    }
    var method_name = await Service.getCallingMethodName();
    var apiEndpointInput = JSON.stringify(req.body);
    apiTrack = await Service.trackApi(
      req.query.user_id,
      method_name,
      apiEndpointInput,
      req.query.device_id,
      req.query.device_info,
      req.ip
    );
    var boutiques = [];
    if (letter) {
      boutiques = await BoutiqueService.getBoutiques(letter);
    } else {
      boutiques = await BoutiqueService.searchBoutiques(search);
    }
    var items = await BoutiqueService.categoryServiceFilter();
    var sortAndFilterFunctions = [];
    if (sortType !== undefined && sortType !== null && sortType !== "") {
      sortAndFilterFunctions.push((boutiques) =>
        BoutiqueService.sortBoutiques(boutiques, sortType)
      );
    }
    if (
      filter_by_gender !== undefined &&
      filter_by_gender !== null &&
      filter_by_gender !== ""
    ) {
      sortAndFilterFunctions.push((boutiques) =>
        BoutiqueService.filterBoutiqueListByGender(boutiques, filter_by_gender)
      );
    }
    if (
      filter_by_item !== undefined &&
      filter_by_item !== null &&
      filter_by_item !== ""
    ) {
      sortAndFilterFunctions.push(async (boutiques) => {
        var filteredBoutiquesByItem =
          await BoutiqueService.filterBoutiquesByItem(filter_by_item);
        return filteredBoutiquesByItem[0];
      });
    }
    var sortedAndFilteredBoutiques = boutiques;
    for (var func of sortAndFilterFunctions) {
      sortedAndFilteredBoutiques = await func(sortedAndFilteredBoutiques);
    }
    if (sortAndFilterFunctions.length === 0) {
      sortedAndFilteredBoutiques = boutiques;
    }
    var organizedServices = [];
    items.forEach((service) => {
      var existingCategory = organizedServices.find(
        (category) => category.category_name === service.parent_category_name
      );
      if (!existingCategory) {
        existingCategory = {
          category_name: service.parent_category_name,
          category_image: s3.getSignedUrl("getObject", {
            Bucket: process.env.AWS_BUCKET,
            Key: `category_item/${service.category_image}`,
            Expires: expirationTime,
          }),
          item: [],
        };
        organizedServices.push(existingCategory);
      }
      existingCategory.item.push({
        item_id: service.item_id,
        item_name: service.item_name,
        item_typename: service.child_category_type,
        item_image: s3.getSignedUrl("getObject", {
          Bucket: process.env.AWS_BUCKET,
          Key: `category_item/${service.item_image}`,
          Expires: expirationTime,
        }),
      });
    });
    sortedAndFilteredBoutiques.forEach((boutique) => {
      var boutiqueDistance = geolib.getDistance(
        { latitude, longitude },
        { latitude: boutique.location_lat, longitude: boutique.location_lng }
      );
      boutique.distance = boutiqueDistance;
      boutique.distanceInKm = boutiqueDistance / 1000;
    });
    var boutiquesWithin500km = sortedAndFilteredBoutiques.filter((boutique) => {
      return boutique.distance <= 500000; // 500 kilometers in meters
    });
    var sortedBoutiques = boutiquesWithin500km.sort(
      (a, b) => a.distance - b.distance
    );
    var responseData = {};
    var expirationTime = 600;
    if (sortedBoutiques.length === 1) {
      responseData = {
        nearbyBoutiques: [
          {
            id: sortedBoutiques[0].id,
            boutique_name: sortedBoutiques[0].boutique_name,
            address: sortedBoutiques[0].address,
            image: s3.getSignedUrl("getObject", {
              Bucket: process.env.AWS_BUCKET,
              Key: `boutique/${sortedBoutiques[0].boutique_logo}`,
              Expires: expirationTime,
            }),
            contact_number: sortedBoutiques[0].contact_number,
            category: mapCategoryType(sortedBoutiques[0].categoryType),
            latitude: sortedBoutiques[0].location_lat,
            longitude: sortedBoutiques[0].location_lng,
            distance: `${sortedBoutiques[0].distanceInKm.toFixed(2)}`,
          },
        ],
      };
    } else {
      responseData = {
        nearbyBoutiques: [],
      };
      for (var i = 0; i < sortedBoutiques.length; i++) {
        var boutique = sortedBoutiques[i];
        var boutiqueLogoUrl = "";
        if (boutique.boutique_logo) {
          boutiqueLogoUrl = await s3.getSignedUrl("getObject", {
            Bucket: process.env.AWS_BUCKET,
            Key: `boutique/${boutique.boutique_logo}`,
            Expires: expirationTime,
          });
        }
        responseData.nearbyBoutiques.push({
          id: boutique.id,
          boutique_name: boutique.boutique_name,
          address: boutique.address,
          image: boutiqueLogoUrl,
          contact_number: boutique.contact_number,
          category: mapCategoryType(boutique.categoryType),
          latitude: boutique.location_lat,
          longitude: boutique.location_lng,
          distance: `${boutique.distanceInKm.toFixed(2)}`,
        });
      }
    }
    var secretKey = "tensorflow";
    var token = generateAccessToken(mobile_number, secretKey);
    if (!token) {
      return res.status(500).send({
        HasError: true,
        StatusCode: 500,
        message: "Failed to generate token",
      });
    } else {
      res.setHeader("X-Auth-Token", token);
      if (!boutiques || boutiques.length === 0) {
        return res.status(200).json({
          HasError: false,
          StatusCode: 200,
          message: "No Data Found",
          nearbyBoutiques: [],
          category: organizedServices
        });
      } else {
        return res.status(200).json({
          HasError: false,
          StatusCode: 200,
          message: "Boutique list retrieving successfully",
          ...responseData,
          category: organizedServices,
        });
      }
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return res.status(500).json({
      HasError: true,
      StatusCode: 500,
      message: "An error occurred while processing the request.",
    });
  }
};

exports.boutiqueDetails = async (req, res) => {
  try {
    // const basicInfo = await BoutiqueService.
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      HasError: true,
      StatusCode: 500,
      message: "An error occurred while processing the request.",
    });
  }
}
