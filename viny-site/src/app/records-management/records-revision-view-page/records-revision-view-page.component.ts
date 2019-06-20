import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoaderComponent } from '../../shared-modules/loader/loader.component';
import { RecordsService } from '../../services/records.service';
import * as _ from 'lodash';

@Component({
  selector: 'app-records-revision-view-page',
  templateUrl: './records-revision-view-page.component.html',
  styleUrls: ['./records-revision-view-page.component.css']
})
export class RecordsRevisionViewPageComponent implements OnInit {
  @ViewChild('releasepageloader', {static: false}) loader: LoaderComponent;
  public _ = _;
  public recordObject = null;
  public imgvconfig = {
    zoomFactor: 0.1,
    wheelZoom: false,
    allowFullscreen: true,
    allowKeyboardNavigation: true,
    customBtns: [],
    btnShow: {
      next: true,
      prev: true,
      zoomIn: true,
      zoomOut: true
    }
  };


  constructor(private route: ActivatedRoute,
              private recordsService: RecordsService) {
  }

  ngOnInit() {
    this.route.paramMap.subscribe((map: any) => {
      const recordId = _.get(map, 'params.recordId', null);
      const revisionId = _.get(map, 'params.revisionId', null);

      this.recordObject  = this.recordsService.fetch_record_revision(recordId, revisionId);
    });
  }

}
