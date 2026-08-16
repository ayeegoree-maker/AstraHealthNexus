import { DatasetLoader } from './datasetLoader.js';
export class DatasetService {
    static async getISSData() {
        return DatasetLoader.loadFile('iss');
    }
    static async getSpaceWeatherData() {
        return DatasetLoader.loadFile('spaceWeather');
    }
    static async getAstronautData() {
        return DatasetLoader.loadFile('astronauts');
    }
    static async getRocketData() {
        return DatasetLoader.loadFile('rocket');
    }
    static async getNASAData() {
        return DatasetLoader.loadFile('nasa');
    }
    static async getMissionData() {
        return DatasetLoader.loadFile('mission');
    }
    static async getDatasetByKey(key) {
        return DatasetLoader.loadFile(key);
    }
    static async getAllData() {
        return DatasetLoader.loadAll();
    }
    static reloadData() {
        DatasetLoader.clearCache();
    }
}
