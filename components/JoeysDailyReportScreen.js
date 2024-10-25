import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import CheckBox from 'react-native-check-box';
import RNPickerSelect from 'react-native-picker-select';
import ApiService from './ApiService';

const JoeysDailyReportScreen = ({ navigation }) => {
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStudents = async () => {
      if (selectedClass) {
        setLoading(true);
        setError(null);
        try {
          const response = await ApiService.getStudents();
          const allStudents = response.data.students;
          const filteredStudents = allStudents.filter(
            (student) => student.section.toLowerCase() === selectedClass.toLowerCase()
          );

          // Initialize student attendance status
          const initializedStudents = filteredStudents.map((student) => ({
            ...student,
            present: false,
            absent: false,
            hadSnack: false,
            notHadSnack: false,
            usedToilet: false,
            notUsedToilet: false,
            editField1: '',
            editField2: '',
          }));

          setStudents(initializedStudents);
        } catch (error) {
          console.error('Error fetching students:', error);
          setError('Failed to fetch students. Please try again later.');
        } finally {
          setLoading(false);
        }
      } else {
        setStudents([]); // Reset students if no class is selected
      }
    };

    fetchStudents();
  }, [selectedClass]); // Fetch students whenever selectedClass changes

  const handleCheckboxToggle = (studentId, field, value) => {
    setStudents((prevStudents) =>
      prevStudents.map((student) => {
        if (student._id === studentId) {
          const updatedStudent = { ...student };
          // Toggle the current checkbox field
          updatedStudent[field] = value;

          // Handle mutually exclusive checkboxes
          if (field === 'present' && value) {
            updatedStudent.absent = false;
          } else if (field === 'absent' && value) {
            updatedStudent.present = false;
          } else if (field === 'hadSnack' && value) {
            updatedStudent.notHadSnack = false;
          } else if (field === 'notHadSnack' && value) {
            updatedStudent.hadSnack = false;
          } else if (field === 'usedToilet' && value) {
            updatedStudent.notUsedToilet = false;
          } else if (field === 'notUsedToilet' && value) {
            updatedStudent.usedToilet = false;
          }
          return updatedStudent;
        }
        return student;
      })
    );
  };

  const validateInputs = () => {
    for (let student of students) {
      if (
        !student.present &&
        !student.absent &&
        !student.hadSnack &&
        !student.notHadSnack &&
        !student.usedToilet &&
        !student.notUsedToilet
      ) {
        Alert.alert('Validation Error', 'All fields must be filled for each student.');
        return false;
      }

      if (student.editField1.trim() === '' || student.editField2.trim() === '') {
        Alert.alert('Validation Error', 'All edit fields must be filled for each student.');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (validateInputs()) {
        try {
            setLoading(true);

            // Create an array of student reports matching the specified format
            const reports = students.map(({ _id, fullName, roll_id, present, absent, hadSnack, notHadSnack, usedToilet, notUsedToilet, editField1, editField2 }) => ({
                studentId: roll_id, // Matches `studentId` in the schema
                studentName: fullName, // Matches `studentName` in the schema
                isPresent: present ? 'Your Child has left the school' : null, // Matches backend handling
                isAbsent: absent ? 'Your Child is still at the school' : null, // Matches backend handling
                hasEaten: hadSnack ? 'Your Child had their Snacks' : null, // Matches backend handling
                hasNotEaten: notHadSnack ? 'Your Child did not have their Snacks.' : null, // Matches backend handling
                hasUsedRestroom: usedToilet ? 'Your Child used the restroom' : null, // Matches backend handling
                hasNotUsedRestroom: notUsedToilet ? 'Your Child did not use the restroom' : null, // Matches backend handling
                todayActivity: editField1 || null, // Matches `todayActivity` in the schema
                circleTimeActivity: editField2 || null, // Matches `circleTimeActivity` in the schema
                dateTime: new Date().toISOString(), // Matches `dateTime` in the schema
            }));

            // Send the reports array to the backend
            await ApiService.sendDailyReports(reports);
            Alert.alert('Success', 'Daily report submitted successfully!');

            const notificationTitle = "Daily Report Posted";
            const notificationMessage = "Daily Reports was posted please check in the  Joeys Daily Report page.";
            const dateTime = new Date().toISOString();

            // Call sendNotification from ApiService
            await ApiService.sendNotification({
            title: notificationTitle,
            message: notificationMessage,
            dateTime: dateTime,
            });
            navigation.goBack();
        } catch (error) {
            console.error('Error submitting report:', error);
            Alert.alert('Error', 'Failed to submit daily report.');
        } finally {
            setLoading(false);
        }
    }
};


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Image source={require('../assets/icon_back.png')} style={styles.icon} />
        </TouchableOpacity>
        <Text style={styles.headerText}>Joeys Daily Report</Text>
      </View>

      <View style={styles.pickerContainer}>
        <RNPickerSelect
          onValueChange={(itemValue) => setSelectedClass(itemValue)}
          items={[
            { label: 'Primary', value: 'primary' },
            { label: 'Pre-Primary', value: 'pre-primary' },
          ]}
          style={pickerSelectStyles}
          placeholder={{ label: 'Select Class', value: null }}
        />
      </View>

      <TouchableOpacity
        style={styles.searchButton}
        onPress={() => {
          if (!selectedClass) {
            alert('Please select a class');
          } else {
            console.log(`Class Selected: ${selectedClass}`);
          }
        }}
      >
        <Text style={styles.buttonText}>Search</Text>
      </TouchableOpacity>

      <View style={styles.contentContainer}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.tableHeaderWrapper}>
            {/* Main Header Row */}
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableSubHeader, { width: 100 }]}>Roll ID</Text>
              <Text style={[styles.tableSubHeader, { width: 150 }]}>Student Name</Text>
              <Text style={[styles.tableSubHeader, { width: 100 }]}>Attendance</Text>
              <Text style={[styles.tableSubHeader, { width: 100 }]}>Snack</Text>
              <Text style={[styles.tableSubHeader, { width: 100 }]}>Toilet</Text>
              <Text style={[styles.tableSubHeader, { width: 100 }]}>Today Activities</Text>
              <Text style={[styles.tableSubHeader, { width: 100 }]}>Circle Time Activities</Text>
            </View>

            {/* Sub Header Row */}
            <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableSubHeader, { height: 35, width: 100 }]}></Text>
            <Text style={[styles.tableSubHeader, { height: 35, width: 150 }]}></Text>

            <TouchableOpacity style={[styles.tableSubHeader, { height: 35, width: 50 }]} onPress={() => setStudents((prevStudents) => prevStudents.map((student) => ({ ...student, present: true, absent: false })))} >
              <Image source={require('../assets/ic_right.png')} style={styles.icon} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.tableSubHeader, { height: 35, width: 50 }]} onPress={() => setStudents((prevStudents) => prevStudents.map((student) => ({ ...student, present: false, absent: true })))} >
              <Image  source={require('../assets/icon_wrong.png')} style={styles.icon}/>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.tableSubHeader, { height: 35, width: 50 }]} onPress={() => setStudents((prevStudents) => prevStudents.map((student) => ({ ...student, hadSnack: true, notHadSnack: false })))} >
              <Image source={require('../assets/ic_right.png')}  style={styles.icon} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.tableSubHeader, { height: 35, width: 50 }]} onPress={() => setStudents((prevStudents) => prevStudents.map((student) => ({ ...student, hadSnack: false, notHadSnack: true })))} >
              <Image source={require('../assets/icon_wrong.png')} style={styles.icon} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.tableSubHeader, { height: 35, width: 50 }]} onPress={() => setStudents((prevStudents) => prevStudents.map((student) => ({ ...student, usedToilet: true, notUsedToilet: false })))} >
              <Image  source={require('../assets/ic_right.png')}  style={styles.icon} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.tableSubHeader, { height: 35, width: 50 }]} onPress={() => setStudents((prevStudents) => prevStudents.map((student) => ({ ...student, usedToilet: false, notUsedToilet: true })))} >
              <Image source={require('../assets/icon_wrong.png')} style={styles.icon} />
            </TouchableOpacity>

            <Text style={[styles.tableSubHeader, { height: 35, width: 100 }]}>Activity Details</Text>
            <Text style={[styles.tableSubHeader, { height: 35, width: 100 }]}>Circle Time Activity Details</Text>
          </View>

            {students.map((student) => (
              <View key={student._id} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: 100 }]}>{student.roll_id}</Text>
                <Text style={[styles.tableCell, { width: 150 }]}>{student.fullName}</Text>

                {/* Attendance Checkboxes */}
                <View style={styles.checkboxGroup}>
                  <CheckBox
                    isChecked={student.present}
                    onClick={() => handleCheckboxToggle(student._id, 'present', !student.present)}
                  />
                  <CheckBox
                    isChecked={student.absent}
                    onClick={() => handleCheckboxToggle(student._id, 'absent', !student.absent)}
                  />
                </View>

                {/* Snack Checkboxes */}
                <View style={styles.checkboxGroup}>
                  <CheckBox
                    isChecked={student.hadSnack}
                    onClick={() => handleCheckboxToggle(student._id, 'hadSnack', !student.hadSnack)}
                  />
                  <CheckBox
                    isChecked={student.notHadSnack}
                    onClick={() => handleCheckboxToggle(student._id, 'notHadSnack', !student.notHadSnack)}
                  />
                </View>

                {/* Toilet Checkboxes */}
                <View style={styles.checkboxGroup}>
                  <CheckBox
                    isChecked={student.usedToilet}
                    onClick={() => handleCheckboxToggle(student._id, 'usedToilet', !student.usedToilet)}
                  />
                  <CheckBox
                    isChecked={student.notUsedToilet}
                    onClick={() => handleCheckboxToggle(student._id, 'notUsedToilet', !student.notUsedToilet)}
                  />
                </View>

                {/* Edit Text Fields */}
                <TextInput
                  style={[styles.tableCell, styles.textInput, { width: 100 }]}
                  value={student.editField1}
                  onChangeText={(text) =>
                    setStudents((prevStudents) =>
                      prevStudents.map((s) =>
                        s._id === student._id ? { ...s, editField1: text } : s
                      )
                    )
                  }
                  placeholder="Edit 1"
                />
                <TextInput
                  style={[styles.tableCell, styles.textInput, { width: 100 }]}
                  value={student.editField2}
                  onChangeText={(text) =>
                    setStudents((prevStudents) =>
                      prevStudents.map((s) =>
                        s._id === student._id ? { ...s, editField2: text } : s
                      )
                    )
                  }
                  placeholder="Edit 2"
                />
              </View>
            ))}
          </View>
        </ScrollView>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Submit</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 8,
  },
  icon: {
    width: 30,
    height: 30,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  pickerContainer: {
    marginVertical: 20,
  },
  searchButton: {
    backgroundColor: '#008CBA',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
  },
  tableHeaderWrapper: {
    marginVertical: 10,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#1B97BB',
  },
  tableSubHeader: {
    flex: 1,
    padding: 10,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  tableCell: {
    flex: 1,
    padding: 10,
    backgroundColor: '#ffffff',
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#008CBA',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 10,
  },
  checkboxGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    marginHorizontal: 5,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 5,
    marginLeft: 5,
  },
});

const pickerSelectStyles = {
  inputIOS: {
    color: 'black',
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#cccccc',
  },
  inputAndroid: {
    color: 'black',
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#cccccc',
  },
};

export default JoeysDailyReportScreen;
