#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Radiologix
Tests all authentication, scan upload, and API endpoints
"""

import requests
import json
import base64
import time
from datetime import datetime

# Configuration
BASE_URL = "https://935f251f-b7bb-4ae5-86c2-87b16a155bc0.preview.emergentagent.com/api"
TIMEOUT = 30

# Test data
TEST_USER = {
    "email": "dr.sarah.johnson@radiologix.com",
    "name": "Dr. Sarah Johnson",
    "password": "SecureRadiology2024!"
}

# Sample base64 image data (small PNG)
SAMPLE_IMAGE_B64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

class RadiologyAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.session.timeout = TIMEOUT
        self.auth_token = None
        self.user_id = None
        self.test_results = []
        
    def log_test(self, test_name, success, message, details=None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "details": details
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def test_health_check(self):
        """Test health check endpoint"""
        try:
            response = self.session.get(f"{BASE_URL}/health")
            if response.status_code == 200:
                data = response.json()
                if "status" in data and data["status"] == "healthy":
                    self.log_test("Health Check", True, "API is healthy")
                    return True
                else:
                    self.log_test("Health Check", False, "Invalid health response format", data)
                    return False
            else:
                self.log_test("Health Check", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Health Check", False, f"Connection error: {str(e)}")
            return False
    
    def test_root_endpoint(self):
        """Test root API endpoint"""
        try:
            response = self.session.get(f"{BASE_URL}/")
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "Radiologix" in data["message"]:
                    self.log_test("Root Endpoint", True, "Root endpoint working correctly")
                    return True
                else:
                    self.log_test("Root Endpoint", False, "Invalid root response", data)
                    return False
            else:
                self.log_test("Root Endpoint", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Root Endpoint", False, f"Connection error: {str(e)}")
            return False
    
    def test_user_registration(self):
        """Test user registration endpoint"""
        try:
            response = self.session.post(
                f"{BASE_URL}/auth/register",
                json=TEST_USER,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["id", "email", "name", "created_at"]
                if all(field in data for field in required_fields):
                    self.user_id = data["id"]
                    self.log_test("User Registration", True, f"User registered successfully with ID: {self.user_id}")
                    return True
                else:
                    self.log_test("User Registration", False, "Missing required fields in response", data)
                    return False
            elif response.status_code == 400:
                # User might already exist, try to continue with login
                self.log_test("User Registration", True, "User already exists (expected for repeated tests)")
                return True
            else:
                self.log_test("User Registration", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("User Registration", False, f"Request error: {str(e)}")
            return False
    
    def test_user_login(self):
        """Test user login endpoint"""
        try:
            login_data = {
                "email": TEST_USER["email"],
                "password": TEST_USER["password"]
            }
            
            response = self.session.post(
                f"{BASE_URL}/auth/login",
                json=login_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data and "token_type" in data:
                    self.auth_token = data["access_token"]
                    self.log_test("User Login", True, "Login successful, JWT token received")
                    return True
                else:
                    self.log_test("User Login", False, "Invalid login response format", data)
                    return False
            else:
                self.log_test("User Login", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("User Login", False, f"Request error: {str(e)}")
            return False
    
    def test_protected_user_info(self):
        """Test protected user info endpoint"""
        if not self.auth_token:
            self.log_test("Protected User Info", False, "No auth token available")
            return False
        
        try:
            headers = {
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json"
            }
            
            response = self.session.get(f"{BASE_URL}/auth/me", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["id", "email", "name", "created_at"]
                if all(field in data for field in required_fields):
                    if data["email"] == TEST_USER["email"]:
                        self.user_id = data["id"]
                        self.log_test("Protected User Info", True, "User info retrieved successfully with valid JWT")
                        return True
                    else:
                        self.log_test("Protected User Info", False, "User info mismatch", data)
                        return False
                else:
                    self.log_test("Protected User Info", False, "Missing required fields", data)
                    return False
            elif response.status_code == 401:
                self.log_test("Protected User Info", False, "JWT token validation failed", response.text)
                return False
            else:
                self.log_test("Protected User Info", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Protected User Info", False, f"Request error: {str(e)}")
            return False
    
    def test_scan_upload(self):
        """Test scan upload endpoint with different scan types"""
        if not self.auth_token:
            self.log_test("Scan Upload", False, "No auth token available")
            return False
        
        scan_types = ["CT", "X-ray", "MRI", "Ultrasound"]
        success_count = 0
        
        for scan_type in scan_types:
            try:
                headers = {"Authorization": f"Bearer {self.auth_token}"}
                
                # Using form data as per the FastAPI endpoint
                form_data = {
                    "scan_type": scan_type,
                    "image_data": SAMPLE_IMAGE_B64
                }
                
                response = self.session.post(
                    f"{BASE_URL}/scans",
                    data=form_data,
                    headers=headers
                )
                
                if response.status_code == 200:
                    data = response.json()
                    required_fields = ["id", "user_id", "scan_type", "image_data", "ai_report", "created_at"]
                    if all(field in data for field in required_fields):
                        if data["scan_type"] == scan_type and data["ai_report"]:
                            success_count += 1
                            self.log_test(f"Scan Upload ({scan_type})", True, f"Scan uploaded and AI report generated")
                        else:
                            self.log_test(f"Scan Upload ({scan_type})", False, "Invalid scan data or missing AI report", data)
                    else:
                        self.log_test(f"Scan Upload ({scan_type})", False, "Missing required fields in response", data)
                else:
                    self.log_test(f"Scan Upload ({scan_type})", False, f"HTTP {response.status_code}", response.text)
            except Exception as e:
                self.log_test(f"Scan Upload ({scan_type})", False, f"Request error: {str(e)}")
        
        if success_count == len(scan_types):
            self.log_test("Scan Upload System", True, f"All {len(scan_types)} scan types uploaded successfully")
            return True
        else:
            self.log_test("Scan Upload System", False, f"Only {success_count}/{len(scan_types)} scan types worked")
            return False
    
    def test_scan_retrieval(self):
        """Test scan retrieval endpoints"""
        if not self.auth_token:
            self.log_test("Scan Retrieval", False, "No auth token available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            
            # Test getting all user scans
            response = self.session.get(f"{BASE_URL}/scans", headers=headers)
            
            if response.status_code == 200:
                scans = response.json()
                if isinstance(scans, list):
                    self.log_test("Get All Scans", True, f"Retrieved {len(scans)} scans")
                    
                    # Test getting individual scan if any exist
                    if scans:
                        scan_id = scans[0]["id"]
                        individual_response = self.session.get(f"{BASE_URL}/scans/{scan_id}", headers=headers)
                        
                        if individual_response.status_code == 200:
                            scan_data = individual_response.json()
                            required_fields = ["id", "user_id", "scan_type", "image_data", "ai_report", "created_at"]
                            if all(field in scan_data for field in required_fields):
                                self.log_test("Get Individual Scan", True, f"Retrieved scan {scan_id}")
                                return True
                            else:
                                self.log_test("Get Individual Scan", False, "Missing required fields", scan_data)
                                return False
                        else:
                            self.log_test("Get Individual Scan", False, f"HTTP {individual_response.status_code}", individual_response.text)
                            return False
                    else:
                        self.log_test("Scan Retrieval", True, "No scans to retrieve individually (empty list)")
                        return True
                else:
                    self.log_test("Get All Scans", False, "Response is not a list", scans)
                    return False
            else:
                self.log_test("Get All Scans", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Scan Retrieval", False, f"Request error: {str(e)}")
            return False
    
    def test_jwt_validation(self):
        """Test JWT token validation with invalid token"""
        try:
            headers = {"Authorization": "Bearer invalid_token_here"}
            response = self.session.get(f"{BASE_URL}/auth/me", headers=headers)
            
            if response.status_code == 401:
                self.log_test("JWT Validation", True, "Invalid token correctly rejected")
                return True
            else:
                self.log_test("JWT Validation", False, f"Expected 401, got {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("JWT Validation", False, f"Request error: {str(e)}")
            return False
    
    def test_cors_configuration(self):
        """Test CORS configuration"""
        try:
            headers = {
                "Origin": "https://example.com",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type"
            }
            
            response = self.session.options(f"{BASE_URL}/auth/login", headers=headers)
            
            # CORS preflight should return 200 or the actual endpoint should handle CORS
            if response.status_code in [200, 204] or "access-control-allow-origin" in response.headers:
                self.log_test("CORS Configuration", True, "CORS headers present")
                return True
            else:
                # Try a simple GET request to check CORS headers
                response = self.session.get(f"{BASE_URL}/health")
                if "access-control-allow-origin" in response.headers:
                    self.log_test("CORS Configuration", True, "CORS configured correctly")
                    return True
                else:
                    self.log_test("CORS Configuration", False, "CORS headers missing", dict(response.headers))
                    return False
        except Exception as e:
            self.log_test("CORS Configuration", False, f"Request error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all backend API tests"""
        print("=" * 60)
        print("RADIOLOGIX BACKEND API TESTING")
        print("=" * 60)
        
        tests = [
            ("API Health Check", self.test_health_check),
            ("Root Endpoint", self.test_root_endpoint),
            ("User Registration", self.test_user_registration),
            ("User Login", self.test_user_login),
            ("Protected User Info", self.test_protected_user_info),
            ("JWT Validation", self.test_jwt_validation),
            ("Scan Upload", self.test_scan_upload),
            ("Scan Retrieval", self.test_scan_retrieval),
            ("CORS Configuration", self.test_cors_configuration)
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            print(f"\n--- Running {test_name} ---")
            if test_func():
                passed += 1
            time.sleep(1)  # Brief pause between tests
        
        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if passed == total:
            print("\n🎉 ALL TESTS PASSED! Backend API is working correctly.")
        else:
            print(f"\n⚠️  {total - passed} test(s) failed. Check the details above.")
        
        return passed == total

if __name__ == "__main__":
    tester = RadiologyAPITester()
    success = tester.run_all_tests()
    
    # Print detailed results
    print("\n" + "=" * 60)
    print("DETAILED TEST RESULTS")
    print("=" * 60)
    for result in tester.test_results:
        status = "✅" if result["success"] else "❌"
        print(f"{status} {result['test']}: {result['message']}")
        if result["details"] and not result["success"]:
            print(f"   Details: {result['details']}")
    
    exit(0 if success else 1)