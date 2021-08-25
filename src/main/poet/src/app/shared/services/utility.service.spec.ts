import { TestBed } from '@angular/core/testing';

import { UtilityService } from './utility.service';
import { Annotation } from "../models/models";
import { MatDialogModule } from "@angular/material/dialog";
import {UserService} from "./user/user.service";
import {HttpClientTestingModule} from "@angular/common/http/testing";

describe('UtilityService', () => {
  let service: UtilityService;
  let fakeAnnotations: Annotation[];
  let fakeOptions;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MatDialogModule, HttpClientTestingModule],
      providers: [UserService]
    });
    service = TestBed.inject(UtilityService);
    fakeAnnotations = getFakeAnnotations();
    fakeOptions = getFakeOptions();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should test reviewer comments', () => {
    expect(service.hasReviewerComments(fakeAnnotations[0])).toBeFalse();
    expect(service.hasReviewerComments(fakeAnnotations[1])).toBeTrue();
  });

  it('should test under review', () => {
    expect(service.isUnderReview(fakeAnnotations[0])).toBeFalse();
    expect(service.isUnderReview(fakeAnnotations[1])).toBeTrue();
  });

  it('should test needs work', () => {
    expect(service.isNeedsWork(fakeAnnotations[0])).toBeTrue();
    expect(service.isNeedsWork(fakeAnnotations[1])).toBeFalse();
  });

  it('should return correct display maxo', () => {
    expect(service.displayMaxoFn(fakeOptions[0])).toEqual("Name1 OntologyId1");
    expect(service.displayMaxoFn(fakeOptions[1])).toEqual("Name2 OntologyId2");
    expect(service.displayMaxoFn(fakeOptions[2])).toEqual("Name3 OntologyId3");
    expect(service.displayMaxoFn(fakeOptions[3])).toEqual("");
  });

  it('should return correct display hpo', () => {
    expect(service.displayHpoFn(fakeOptions[0])).toEqual("Name1 Id1");
    expect(service.displayHpoFn(fakeOptions[1])).toEqual("Name2 Id2");
    expect(service.displayHpoFn(fakeOptions[2])).toEqual("Name3 Id3");
    expect(service.displayHpoFn(fakeOptions[3])).toEqual("");
  });

  it('should return correct disease source boolean', () => {
    expect(service.isDiseaseSource("OMIM:01931")).toBeTrue();
    expect(service.isDiseaseSource("PMID:01931")).toBeFalse();
    expect(service.isDiseaseSource("")).toBeFalse();
    expect(service.isDiseaseSource("PMID:009311")).toBeFalse();
  })

  it('it should return correct elevated actions boolean', () => {
    expect(service.showElevatedActions("ELEVATED_CURATOR", getFakeAnnotations()[1])).toBeTrue();
    expect(service.showElevatedActions("ELEVATED_CURATOR", getFakeAnnotations()[0])).toBeFalse();
    expect(service.showElevatedActions("CURATOR", getFakeAnnotations()[1])).toBeFalse();
    expect(service.showElevatedActions("CURATOR", getFakeAnnotations()[0])).toBeFalse();
  })

  function getFakeAnnotations(): Annotation[]
  {
   return [{

     id: "1",
     type: "phenotype",
     status: "NEEDS_WORK",
     reviewMessages: [],
     owner: {
       nickname: "curatr",
       userRole: "Role"
     },
     annotationSource: {
       publication: {
         publicationId: "some fake publication id",
         publicationName: "some fake publication name",
         date: "2019-4-06",
         doi: "02392382",
         firstAuthor: "alex jones"
       },
       disease: {
         diseaseId: "OMIM:79384",
         diseaseName: "some disease name",
         equivalentId: "some id",
         description: "disease description"
       }
     }
   },
     {
       id: "1",
       type: "phenotype",
       status: "UNDER_REVIEW",
       owner: {
         nickname: "curatr",
         userRole: "Role"
       },
       annotationSource: {
         publication: {
           publicationId: "some fake publication id",
           publicationName: "some fake publication name",
           date: "2019-4-06",
           doi: "02392382",
           firstAuthor: "alex jones"
         },
         disease: {
           diseaseId: "OMIM:79384",
           diseaseName: "some disease name",
           equivalentId: "some id",
           description: "disease description"
         }
       },
       reviewMessages: [{ reviewer: {
           nickname: "curatr",
           userRole: "Role"
         }, value: "the message"}],
     }
   ];
  }

  function getFakeOptions()
  {
    return [{ name: "Name1", id: "Id1", ontologyId: "OntologyId1"},
      { name: "Name2", id: "Id2", ontologyId: "OntologyId2"},
      { name: "Name3", id: "Id3", ontologyId: "OntologyId3"},
      {}
    ];
  }
});
