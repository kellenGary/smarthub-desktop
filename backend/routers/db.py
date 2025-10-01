from fastapi import APIRouter
from constants import supabase

router = APIRouter(
    prefix="/db",
    tags=["db"],
    responses={404: {"description": "Not found"}}
)

# Adds a test to the database
# Add idempotent ability so duplicate writes don't occur
@router.post("/write_test")
async def write_test(data: dict):
    user = supabase.auth.get_user()
    user_id = user.user.id
    test_files_response = (
        supabase.table("test_files")
        .insert({
            "distance": data["distance"],
            "timeStamp": data["testData"]["timeStamp"],
            "displacement": data["testData"]["displacement"],
            "velocity": data["testData"]["velocity"],
            "heading": data["testData"]["heading"],
            "trajectory_x": data["testData"]["trajectory_x"],
            "trajectory_y": data["testData"]["trajectory_y"],
            "gyro_left": data["testData"]["gyro_left"],
            "gyro_right": data["testData"]["gyro_right"],
            "accel_right": data["testData"]["accel_right"],
            "accel_left": data["testData"]["accel_left"],
        })
        .execute()
    )
    test_file_id = test_files_response.data[0]["id"]
    test_info_response = (
        supabase.table("test_info")
        .insert({
            "test_file_id": test_file_id,
            "comments": data["comments"],
            "test_name": data["testName"],
            "flags": data["flags"],
            "recorded_by_user_id": user_id,
        })
        .execute()
    )
    return {"test_file_id": test_file_id, "test_info": test_info_response.data[0]}

# Fetches all tests with pagination
@router.get("/tests")
async def get_tests(page: int = 1, limit: int = 10):
    # Calculate offset for pagination
    offset = (page - 1) * limit
    
    # Get total count for pagination info
    count_response = (
        supabase.table("test_info")
        .select("id", count="exact")
        .execute()
    )
    total_count = count_response.count
    
    # Get paginated tests
    response = (
        supabase.table("test_info")
        .select("*, test_files(displacement, velocity, heading, trajectory_x, trajectory_y, timeStamp)")
        .order("id", desc=True)  # Order by newest first
        .range(offset, offset + limit - 1)
        .execute()
    )
    
    # Calculate pagination metadata
    total_pages = (total_count + limit - 1) // limit  # Ceiling division
    has_next = page < total_pages
    has_previous = page > 1
    
    return {
        "data": response.data,
        "pagination": {
            "current_page": page,
            "total_pages": total_pages,
            "total_count": total_count,
            "limit": limit,
            "has_next": has_next,
            "has_previous": has_previous
        }
    }

# Converts the response from supabase into the format:
#   "displacement" : {"displacement": [], "timeStamp": []},
#   "velocity" : {"velocity": [], "timeStamp": []},
#   "heading" : {"heading": [], "timeStamp": []},
#   "trajectory" : {"trajectory_y": [], "trajectory_x": [], "timeStamp": []}
def format_for_review(response):
    test_data = response.data[0]
    test_files = test_data["test_files"]
    time_stamps = test_files["timeStamp"]

    # Format individual data types with timestamps
    def format_data_with_time(data_array, data_type):
        return [
            {
                "time": round(float(time) / 1000, 2),
                data_type: data_array[index] if index < len(data_array) else None
            }
            for index, time in enumerate(time_stamps)
        ]

    # Format trajectory data with timestamps
    def format_trajectory_data():
        trajectory_x = test_files["trajectory_x"]
        trajectory_y = test_files["trajectory_y"]
        return [
            {
                "time": round(float(time) / 1000, 2),
                "trajectory_x": trajectory_x[index] if index < len(trajectory_x) else None,
                "trajectory_y": trajectory_y[index] if index < len(trajectory_y) else None
            }
            for index, time in enumerate(time_stamps)
        ]

    formatted_response = {
        **test_data,
        "displacement": format_data_with_time(test_files["displacement"], "displacement"),
        "velocity": format_data_with_time(test_files["velocity"], "velocity"),
        "heading": format_data_with_time(test_files["heading"], "heading"),
        "trajectory": format_trajectory_data()
    }

    return formatted_response

# Get a single test
@router.get("/tests/{test_id}")
async def get_test(test_id: int, response_format: str = None):
    response = (
        supabase.table("test_info")
        .select("*, test_files(*)")
        .eq("id", test_id)
        .execute()
    )

    if response_format == "review":
        formatted_response = format_for_review(response)
        return formatted_response

    return response

# Get all announcements
@router.get("/announcements")
async def get_announcements():
    response = (
        supabase.table("announcements")
        .select("*")
        .execute()
    )
    return response

# Changes the test at the given id based on the new test data
# EX. in testName.js the user can change the test name
@router.put("/update_test/{test_id}")
async def update_test(test_id: int, new_data: dict):
    response = (
        supabase.table("test_info")
        .update(new_data)
        .eq("id", test_id)
        .execute()
    )
    return response