import { Injectable } from '@nestjs/common';
import {
    OPEN_STREET_MAP_REVERSE_COORDINATES_URL,
    OPEN_STREET_MAP_SEARCH_POSTAL_CODE_URL,
} from '../../project/project.constant';
import axios from 'axios';
import {
    IGetCoordinates,
    IGetPostalCode,
} from '../../project/project.interface';
import { parseToCamelCase } from 'src/common/helpers/commonFunctions';

@Injectable()
export class OpenStreetMapService {
    async getCoordinatesDetails(coordinates: IGetPostalCode) {
        try {
            return parseToCamelCase(
                await axios.get(OPEN_STREET_MAP_REVERSE_COORDINATES_URL, {
                    params: {
                        lon: coordinates.longitude,
                        lat: coordinates.latitude,
                        format: 'json',
                    },
                }),
            );
        } catch (error) {
            throw error;
        }
    }

    async getCoordinatesFromPostalCode(data: IGetCoordinates) {
        try {
            return parseToCamelCase(
                await axios.get(OPEN_STREET_MAP_SEARCH_POSTAL_CODE_URL, {
                    params: {
                        postalcode: data.postalCode,
                        countrycodes: data.countryCode,
                        format: 'jsonv2',
                    },
                }),
            );
        } catch (error) {
            throw error;
        }
    }
}
